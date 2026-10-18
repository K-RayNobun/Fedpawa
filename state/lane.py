#!/usr/bin/env python3
"""
lane.py — Tableau de suivi des lanes Fedpawa (orchestration multi-agents).

Données:
  state/board.json  : état machine-readable de toutes les lanes (source de vérité)
  state/lanes/<ID>.md : journal append-only par lane (position exacte en cas de crash)

Commandes:
  new / claim / log / done / fail / status / show
Aucune dépendance externe. Python 3.8+.
"""
import argparse
import fcntl
import json
import os
import sys
from datetime import datetime, timezone

STATE = os.path.dirname(os.path.abspath(__file__))
BOARD = os.path.join(STATE, "board.json")
LANES = os.path.join(STATE, "lanes")
LOCK = BOARD + ".lock"

os.makedirs(LANES, exist_ok=True)
open(LOCK, "a").close()

STATUSES = ["backlog", "in_progress", "review", "done", "failed"]


def now_dt():
    return datetime.now(timezone.utc)


def fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S") + " UTC"


def parse_dt(s):
    return datetime.strptime(s, "%Y-%m-%d %H:%M:%S UTC").replace(tzinfo=timezone.utc)


def load():
    if not os.path.exists(BOARD):
        return {"seq": 0, "lanes": []}
    with open(BOARD, encoding="utf-8") as f:
        return json.load(f)


def save(board):
    with open(LOCK) as lf:
        fcntl.flock(lf, fcntl.LOCK_EX)
        try:
            tmp = BOARD + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(board, f, ensure_ascii=False, indent=2)
            os.replace(tmp, BOARD)
        finally:
            fcntl.flock(lf, fcntl.LOCK_UN)


def get_lane(board, lid):
    for l in board["lanes"]:
        if l["id"] == lid:
            return l
    sys.exit("Lane inconnue: " + lid + "  (lane.py status pour la liste)")


def journal_append(lid, title, body):
    path = os.path.join(LANES, lid + ".md")
    with open(path, "a", encoding="utf-8") as f:
        f.write("\n## " + fmt(now_dt()) + " | " + title + "\n" + body.rstrip() + "\n")


def cmd_new(a):
    board = load()
    board["seq"] += 1
    lid = "L%03d" % board["seq"]
    lane = {
        "id": lid,
        "title": a.title,
        "priority": a.priority,
        "status": "backlog",
        "created_at": fmt(now_dt()),
        "last_update": fmt(now_dt()),
        "agent": None,
        "claimed_at": None,
        "context_file": a.ctx or None,
        "artifacts": [],
        "summary": None,
    }
    board["lanes"].append(lane)
    save(board)
    lines = []
    lines.append("# Lane " + lid + " | " + a.title)
    lines.append("")
    lines.append("Priorite: " + a.priority + " | Statut: backlog | Creee: " + lane["created_at"])
    lines.append("")
    lines.append("## Mandat")
    lines.append(a.mandate or "(voir message d'assignation)")
    lines.append("")
    if a.ctx:
        lines.append("## Contexte a lire en premier: " + a.ctx)
        lines.append("")
    lines.append("## Journal (append-only | dater CHAQUE avancee)")
    with open(os.path.join(LANES, lid + ".md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(lid)


def cmd_claim(a):
    board = load()
    lane = get_lane(board, a.lane_id)
    lane["status"] = "in_progress"
    lane["agent"] = a.agent or "inconnu"
    lane["claimed_at"] = fmt(now_dt())
    lane["last_update"] = lane["claimed_at"]
    save(board)
    journal_append(a.lane_id, "CLAIM par " + lane["agent"], "Lane prise en charge.")
    print("OK " + a.lane_id + " -> in_progress par " + lane["agent"])


def cmd_log(a):
    board = load()
    lane = get_lane(board, a.lane_id)
    lane["last_update"] = fmt(now_dt())
    if a.artifact:
        lane["artifacts"] = sorted(set(lane.get("artifacts", []) + [a.artifact]))
    save(board)
    body = a.message
    if a.artifact:
        body += "\nArtefact: " + a.artifact
    journal_append(a.lane_id, a.kind, body)
    print("OK log " + a.lane_id)


def cmd_done(a):
    board = load()
    lane = get_lane(board, a.lane_id)
    lane["status"] = "done"
    lane["last_update"] = fmt(now_dt())
    lane["summary"] = a.summary or ""
    if a.report:
        lane["artifacts"] = sorted(set(lane.get("artifacts", []) + [a.report]))
    save(board)
    body = a.summary or ""
    if a.report:
        body += "\nRapport: " + a.report
    journal_append(a.lane_id, "DONE", body)
    print("OK " + a.lane_id + " -> done")


def cmd_fail(a):
    board = load()
    lane = get_lane(board, a.lane_id)
    lane["status"] = "failed"
    lane["last_update"] = fmt(now_dt())
    lane["summary"] = a.reason or ""
    save(board)
    journal_append(a.lane_id, "FAIL", "Position a l'arret: " + (a.reason or ""))
    print("OK " + a.lane_id + " -> failed (journal conserve = position d'arret)")


def age_min(s):
    try:
        return (now_dt() - parse_dt(s)).total_seconds() / 60.0
    except Exception:
        return -1.0


def cmd_status(a):
    board = load()
    if a.json:
        out = []
        for l in board["lanes"]:
            d = dict(l)
            am = age_min(l.get("last_update", ""))
            d["age_min"] = round(am, 1)
            d["stale"] = l["status"] == "in_progress" and am > a.stale_min
            out.append(d)
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return
    cols = {}
    for st in STATUSES:
        cols[st] = []
    for l in board["lanes"]:
        mark = ""
        if l["status"] == "in_progress":
            am = age_min(l.get("last_update", ""))
            if am > a.stale_min:
                mark = "  [STALE " + str(int(am)) + "min | verifier le journal]"
            else:
                mark = "  (MAJ il y a " + str(int(am)) + "min)"
        cols[l["status"]].append("  " + l["id"] + " [" + l["priority"] + "] " + l["title"][:64] + mark)
    titles = {
        "backlog": "BACKLOG",
        "in_progress": "EN COURS",
        "review": "REVIEW",
        "done": "TERMINE",
        "failed": "ECHEC (journal = position d'arret)",
    }
    for st in STATUSES:
        print("== " + titles[st] + " (" + str(len(cols[st])) + ")")
        for row in cols[st]:
            print(row)
    print("")
    print("Detail: lane.py show <ID> | Journal: state/lanes/<ID>.md | Stale si in_progress sans MAJ > " + str(a.stale_min) + "min")


def cmd_show(a):
    board = load()
    lane = get_lane(board, a.lane_id)
    print(json.dumps(lane, ensure_ascii=False, indent=2))
    p = os.path.join(LANES, a.lane_id + ".md")
    if os.path.exists(p):
        print("----- Journal -----")
        with open(p, encoding="utf-8") as f:
            print(f.read())


def main():
    p = argparse.ArgumentParser(description="Suivi des lanes Fedpawa")
    sp = p.add_subparsers(dest="cmd", required=True)

    n = sp.add_parser("new", help="Creer une lane")
    n.add_argument("--title", required=True)
    n.add_argument("--priority", default="P2", choices=["P0", "P1", "P2", "P3"])
    n.add_argument("--mandate", default="")
    n.add_argument("--ctx", default="")
    n.set_defaults(fn=cmd_new)

    c = sp.add_parser("claim", help="Prendre en charge une lane")
    c.add_argument("lane_id")
    c.add_argument("--agent", default="")
    c.set_defaults(fn=cmd_claim)

    g = sp.add_parser("log", help="Journaliser une avancee")
    g.add_argument("lane_id")
    g.add_argument("message")
    g.add_argument("--kind", default="PROGRES")
    g.add_argument("--artifact", default="")
    g.set_defaults(fn=cmd_log)

    d = sp.add_parser("done", help="Terminer une lane")
    d.add_argument("lane_id")
    d.add_argument("--summary", default="")
    d.add_argument("--report", default="")
    d.set_defaults(fn=cmd_done)

    f2 = sp.add_parser("fail", help="Marquer bloquee/crashee")
    f2.add_argument("lane_id")
    f2.add_argument("--reason", default="")
    f2.set_defaults(fn=cmd_fail)

    s = sp.add_parser("status", help="Vue du tableau")
    s.add_argument("--json", action="store_true")
    s.add_argument("--stale-min", type=int, default=20)
    s.set_defaults(fn=cmd_status)

    sh = sp.add_parser("show", help="Lane complete + journal")
    sh.add_argument("lane_id")
    sh.set_defaults(fn=cmd_show)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
