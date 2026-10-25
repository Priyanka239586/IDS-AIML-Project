"""GET /alerts — Simulated alert log. Every alert has is_simulated=True."""

import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter

router = APIRouter(prefix="/alerts", tags=["Alerts"])

_TEMPLATES = [
    {"type": "DoS",    "severity": "critical", "msg": "SYN flood from {src} targeting port 80 (neptune)"},
    {"type": "DoS",    "severity": "critical", "msg": "ICMP smurf amplification from {src}"},
    {"type": "DoS",    "severity": "high",     "msg": "UDP storm detected from {src}"},
    {"type": "DoS",    "severity": "high",     "msg": "Teardrop fragmentation attack from {src}"},
    {"type": "Probe",  "severity": "medium",   "msg": "Port sweep from {src} (portsweep pattern)"},
    {"type": "Probe",  "severity": "medium",   "msg": "IP sweep across /24 subnet from {src}"},
    {"type": "Probe",  "severity": "low",      "msg": "Nmap OS fingerprint attempt from {src}"},
    {"type": "R2L",    "severity": "high",     "msg": "Brute-force SSH login from {src} to {dest}"},
    {"type": "R2L",    "severity": "high",     "msg": "FTP write exploit attempt from {src}"},
    {"type": "R2L",    "severity": "medium",   "msg": "Password guessing (guess_passwd) from {src}"},
    {"type": "U2R",    "severity": "critical", "msg": "Privilege escalation on {dest} (rootkit)"},
    {"type": "U2R",    "severity": "critical", "msg": "Buffer overflow attempt on {dest}"},
    {"type": "Normal", "severity": "low",      "msg": "Normal HTTP session from {src}"},
    {"type": "Normal", "severity": "low",      "msg": "Normal FTP transfer from {src}"},
]


def _ip(rng: random.Random) -> str:
    return f"{rng.randint(10,192)}.{rng.randint(0,255)}.{rng.randint(0,255)}.{rng.randint(1,254)}"


def _build_alerts(n: int = 50) -> list:
    rng = random.Random(42)   # fixed seed for consistent demo output
    now = datetime.utcnow()
    alerts = []
    for i in range(n):
        t    = _TEMPLATES[i % len(_TEMPLATES)]
        src  = _ip(rng)
        dest = _ip(rng)
        ts   = now - timedelta(seconds=rng.randint(0, 7200))
        alerts.append({
            "id":           f"ALT-{2000 + i}",
            "timestamp":    ts.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "attack_type":  t["type"],
            "severity":     t["severity"],
            "source_ip":    src,
            "dest_ip":      dest,
            "confidence":   round(rng.uniform(0.70, 0.99), 3),
            "message":      t["msg"].format(src=src, dest=dest),
            "is_simulated": True,
        })
    return sorted(alerts, key=lambda x: x["timestamp"], reverse=True)


_ALERTS = _build_alerts(50)


@router.get("/", summary="Simulated alert log")
async def get_alerts(
    limit: int = 20,
    attack_type: Optional[str] = None,
    severity: Optional[str] = None,
):
    """
    Returns a simulated alert log for demonstration purposes.
    ⚠️ All alerts are SIMULATED — is_simulated=true on every record.
    Filter by attack_type (Normal/DoS/Probe/R2L/U2R) or severity (low/medium/high/critical).
    """
    filtered = _ALERTS
    if attack_type and attack_type.lower() != "all":
        filtered = [a for a in filtered if a["attack_type"].lower() == attack_type.lower()]
    if severity and severity.lower() != "all":
        filtered = [a for a in filtered if a["severity"].lower() == severity.lower()]
    return {
        "alerts":      filtered[:limit],
        "total":       len(filtered),
        "disclaimer":  "⚠️ All alerts are simulated for demo purposes. is_simulated=true on every record.",
    }
