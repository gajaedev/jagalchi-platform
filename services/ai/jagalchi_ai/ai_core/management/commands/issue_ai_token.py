from __future__ import annotations

import time
from pathlib import Path

import jwt
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Issue a development JWT for AI API access (Authorization: Bearer <token>)."

    def add_arguments(self, parser):
        parser.add_argument("--sub", required=True, help="Token subject (e.g. user-1)")
        parser.add_argument("--roadmap-id", dest="roadmap_id", help="Roadmap scope (claim: roadmapId)")
        parser.add_argument(
            "--permissions",
            default="EDIT",
            help="Comma-separated permissions (e.g. READ,EDIT). Default: EDIT",
        )
        parser.add_argument(
            "--exp",
            type=int,
            help="Expiry as epoch seconds (exp claim). If omitted, uses --days (default: 365).",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=365,
            help="Expiry in days from now when --exp is omitted. Default: 365",
        )
        parser.add_argument(
            "--export",
            help="If provided, prints as 'NAME=<token>' (useful for .env).",
        )
        parser.add_argument(
            "--write-env-file",
            dest="write_env_file",
            help="If provided, upserts the exported NAME into this env file (requires --export).",
        )

    def handle(self, *args, **options):
        secret = getattr(settings, "AI_AUTH_JWT_SECRET", "") or ""
        algorithm = getattr(settings, "AI_AUTH_JWT_ALGORITHM", "HS256")

        if not secret:
            raise CommandError("AI_AUTH_JWT_SECRET is empty. Set it in .env first.")

        now = int(time.time())
        exp = options.get("exp") or (now + int(options["days"]) * 24 * 60 * 60)

        permissions = [p.strip().upper() for p in str(options["permissions"]).split(",") if p.strip()]
        if not permissions:
            raise CommandError("--permissions must not be empty.")

        payload: dict[str, object] = {
            "sub": options["sub"],
            "permissions": permissions,
            "iat": now,
            "exp": int(exp),
        }
        if options.get("roadmap_id"):
            payload["roadmapId"] = options["roadmap_id"]

        token = jwt.encode(payload, secret, algorithm=algorithm)
        if isinstance(token, bytes):
            token = token.decode("utf-8")

        export_name = options.get("export")
        write_env_file = options.get("write_env_file")

        if write_env_file and not export_name:
            raise CommandError("--write-env-file requires --export.")

        if export_name:
            line = f"{export_name}={token}"
            self.stdout.write(line)
            if write_env_file:
                _upsert_env_line(Path(write_env_file), export_name, token)
                self.stdout.write(f"(updated {write_env_file})")
            return

        self.stdout.write(token)


def _upsert_env_line(env_path: Path, key: str, value: str) -> None:
    env_path.parent.mkdir(parents=True, exist_ok=True)

    lines: list[str] = []
    if env_path.exists():
        lines = env_path.read_text(encoding="utf-8").splitlines()

    needle = f"{key}="
    replaced = False
    new_lines: list[str] = []
    for raw in lines:
        if raw.startswith(needle):
            new_lines.append(f"{key}={value}")
            replaced = True
        else:
            new_lines.append(raw)

    if not replaced:
        if new_lines and new_lines[-1].strip():
            new_lines.append("")
        new_lines.append(f"{key}={value}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

