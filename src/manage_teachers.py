import getpass
import json

from src.auth import TEACHERS_FILE, create_password_hash, load_teachers


def main() -> None:
    username = input("Teacher username: ").strip()
    if not username:
        raise SystemExit("Username cannot be empty.")

    teachers = load_teachers() if TEACHERS_FILE.exists() else []
    if any(teacher["username"] == username for teacher in teachers):
        raise SystemExit(f"A teacher named {username!r} already exists.")

    password = getpass.getpass("Teacher password: ")
    if not password:
        raise SystemExit("Password cannot be empty.")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")

    salt, password_hash = create_password_hash(password)
    teachers.append(
        {"username": username, "salt": salt, "password_hash": password_hash}
    )
    TEACHERS_FILE.write_text(
        json.dumps(teachers, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Added teacher {username!r}.")


if __name__ == "__main__":
    main()
