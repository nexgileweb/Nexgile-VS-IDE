#!/usr/bin/env python3
import os
import random
import subprocess
from datetime import datetime, timedelta

# Authors configuration
AUTHORS = [
    ("Alok Pottabathini", "alok@nexgile.com"),
    ("Sri K", "srinivas@nexgile.com"),
    ("Spandana", "spandana@nexgile.com"),
    ("Anuradha Bandla", "anuradha@nexgile.com"),
    ("Krishna", "krishna@nexgile.com"),
]

# Realistic commit message templates
COMPONENTS = ["editor", "syntax highlighter", "file explorer", "debugger", "terminal", "IntelliSense", "completion", "formatter", "linter", "build system", "search", "git integration", "theme", "settings", "toolbar", "status bar", "output panel", "problems view", "extensions manager", "workspace"]
ACTIONS = ["opening a file", "saving changes", "building project", "running tests", "debugging", "closing editor", "switching tabs", "searching files", "applying changes", "loading workspace"]
SYPTOMS = ["slow performance", "incorrect output", "crash", "freeze", "error", "timeout", "memory leak", "blank screen", "incorrect rendering", "data loss"]
FEATURES = ["new file wizard", "remote debugging", "code snippets", "multi-cursor editing", "live share", "gitLens integration", "AI assistance", "keyboard macros", "custom themes", "webSocket support"]
USE_CASES = ["remote development", "containerized builds", "cloud deployment", "team collaboration", "CI/CD integration", "code review", "pair programming"]

def get_random_message():
    """Generate a random realistic commit message."""
    categories = [
        ("Fixed issue with {} not responding", ["editor", "terminal", "debugger", "search"]),
        ("Fixed crash when {}", ["opening a file", "saving changes", "building project"]),
        ("Resolved bug in {} causing {}", ["editor", "IntelliSense", "completion"], SYPTOMS),
        ("Added support for {}", FEATURES),
        ("Implemented {}", FEATURES),
        ("Applied patch for {}", ["editor", "debugger", "build system"]),
        ("Hotfix for {}", SYPTOMS),
        ("Refactored {} for better performance", COMPONENTS),
        ("Cleaned up {} code", COMPONENTS),
        ("Added tests for {}", COMPONENTS),
    ]
    template, *fills = random.choice(categories)
    if fills:
        return template.format(random.choice(fills[0]))
    return template

def generate_random_date(start_date, end_date):
    """Generate a random datetime between start and end dates."""
    time_diff = end_date - start_date
    random_seconds = random.randint(0, int(time_diff.total_seconds()))
    return start_date + timedelta(seconds=random_seconds)

def run_git(env_vars, *args):
    """Run git command with custom environment."""
    env = os.environ.copy()
    env.update(env_vars)
    result = subprocess.run(["git"] + list(args), cwd=REPO_PATH, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Git error: {result.stderr}")
    return result

REPO_PATH = r"C:\Users\User\Desktop\Nexgile-VS-IDE-USA"

def generate_commits(num_commits=800):
    """Generate commits in the repository."""
    os.chdir(REPO_PATH)

    start_date = datetime(2025, 11, 1, 0, 0, 0)
    end_date = datetime(2026, 6, 11, 23, 59, 59)

    # Stage all files
    subprocess.run(["git", "add", "-A"], cwd=REPO_PATH)

    print(f"Generating {num_commits} commits...")

    for i in range(num_commits):
        # Pick random author
        name, email = random.choice(AUTHORS)

        # Generate random date
        commit_date = generate_random_date(start_date, end_date)
        date_str = commit_date.strftime('%Y-%m-%dT%H:%M:%S')

        # Generate commit message
        message = get_random_message()

        # Create commit with specific date and author using environment variables
        env = {
            'GIT_AUTHOR_NAME': name,
            'GIT_AUTHOR_EMAIL': email,
            'GIT_COMMITTER_NAME': name,
            'GIT_COMMITTER_EMAIL': email,
            'GIT_AUTHOR_DATE': date_str,
            'GIT_COMMITTER_DATE': date_str,
        }

        result = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=REPO_PATH,
            env={**os.environ, **env},
            capture_output=True,
            text=True
        )

        if result.returncode != 0 and "nothing to commit" not in result.stderr:
            print(f"Error: {result.stderr}")

        if (i + 1) % 100 == 0:
            print(f"  Created {i + 1}/{num_commits} commits...")

    print(f"Done! Created {num_commits} commits.")

    # Show summary
    subprocess.run(["git", "shortlog", "-sn"], cwd=REPO_PATH)

if __name__ == "__main__":
    import sys
    num_commits = 850
    if len(sys.argv) > 1:
        num_commits = int(sys.argv[1])
    generate_commits(num_commits)