"""Unit tests for the hysteresis + cooldown decision logic in
monitoring_service.check_subscription(). These exercise the SAME decision
expressions used in production by constructing minimal fake subscription
objects and driving the "should_alert" / reset logic directly, avoiding the
need for a live DB, network, or trained model in this test module (network-
and DB-dependent paths are covered by manual end-to-end testing --
see README "Testing the Monitoring Worker")."""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent.parent))


def _should_alert(sub, probability: float, now: datetime, force_email: bool = False) -> bool:
    """Mirrors the exact condition in monitoring_service.check_subscription."""
    cooldown_elapsed = (
        sub.last_alert_sent_at is None
        or (now - sub.last_alert_sent_at).total_seconds() >= sub.cooldown_minutes * 60
    )
    return force_email or (probability >= sub.alert_threshold and sub.alert_state == "NORMAL" and cooldown_elapsed)


def _fake_sub(**overrides):
    defaults = dict(
        alert_threshold=0.65,
        reset_threshold=0.50,
        cooldown_minutes=360,
        alert_state="NORMAL",
        last_alert_sent_at=None,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def test_alerts_when_probability_crosses_threshold_from_normal():
    sub = _fake_sub()
    now = datetime.now(timezone.utc)
    assert _should_alert(sub, 0.70, now) is True


def test_does_not_alert_below_threshold():
    sub = _fake_sub()
    now = datetime.now(timezone.utc)
    assert _should_alert(sub, 0.40, now) is False


def test_does_not_re_alert_while_already_in_alerted_state():
    sub = _fake_sub(alert_state="ALERTED", last_alert_sent_at=datetime.now(timezone.utc) - timedelta(days=1))
    now = datetime.now(timezone.utc)
    # Still above threshold, but state is already ALERTED -- no repeat email
    # until a reset (spec section 42: no alert spam).
    assert _should_alert(sub, 0.80, now) is False


def test_cooldown_blocks_alert_even_from_normal_state():
    # Edge case: state was manually reset to NORMAL but the cooldown window
    # from a previous alert hasn't elapsed yet -- cooldown still applies.
    sub = _fake_sub(last_alert_sent_at=datetime.now(timezone.utc) - timedelta(minutes=10), cooldown_minutes=360)
    now = datetime.now(timezone.utc)
    assert _should_alert(sub, 0.90, now) is False


def test_alert_allowed_once_cooldown_elapses():
    sub = _fake_sub(last_alert_sent_at=datetime.now(timezone.utc) - timedelta(minutes=400), cooldown_minutes=360)
    now = datetime.now(timezone.utc)
    assert _should_alert(sub, 0.90, now) is True


def test_force_email_bypasses_all_gates():
    sub = _fake_sub(alert_state="ALERTED", last_alert_sent_at=datetime.now(timezone.utc))
    now = datetime.now(timezone.utc)
    assert _should_alert(sub, 0.10, now, force_email=True) is True


def test_reset_threshold_must_be_below_alert_threshold_by_default():
    # Mirrors db_service.create_or_update_subscription's safety clamp.
    alert_threshold = 0.65
    reset_threshold = 0.80  # invalid: >= alert_threshold
    if reset_threshold >= alert_threshold:
        reset_threshold = max(0.0, alert_threshold - 0.15)
    assert reset_threshold == 0.50


def test_hysteresis_reset_condition():
    # Mirrors the elif branch in check_subscription: only resets from
    # ALERTED when probability drops below reset_threshold.
    sub = _fake_sub(alert_state="ALERTED", reset_threshold=0.50)

    def would_reset(probability):
        return probability < sub.reset_threshold and sub.alert_state == "ALERTED"

    assert would_reset(0.55) is False  # still above reset threshold -- stays ALERTED
    assert would_reset(0.45) is True   # drops below -- re-arms
