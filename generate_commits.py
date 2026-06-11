#!/usr/bin/env python3
import os
import random
import subprocess
import sys
from datetime import datetime, timedelta

# Authors configuration
AUTHORS = [
    ("Alok Pottabathini", "alok@nexgile.com"),
    ("Sri K", "srinivas@nexgile.com"),
    ("Spandana", "spandana@nexgile.com"),
    ("Anuradha Bandla", "anuradha@nexgile.com"),
    ("Krishna", "krishna@nexgile.com"),
]

COMPONENTS = ["editor", "syntax highlighter", "file explorer", "debugger", "terminal", "IntelliSense", "completion", "formatter", "linter", "build system", "search", "git integration", "theme", "settings", "toolbar", "status bar"]
ACTIONS = ["opening a file", "saving changes", "building project", "running tests", "debugging", "closing editor", "switching tabs", "searching files"]
SYPTOMS = ["slow performance", "incorrect output", "crash", "freeze", "error", "timeout", "memory leak"]
FEATURES = ["new file wizard", "remote debugging", "code snippets", "multi-cursor editing", "live share", "gitLens integration"]

def get_random_message():
    templates = [
        f"Fixed issue with {random.choice(COMPONENTS)} not responding",
        f"Fixed crash when {random.choice(ACTIONS)}",
        f"Resolved bug in {random.choice(COMPONENTS)} causing {random.choice(SYPTOMS)}",
        f"Added support for {random.choice(FEATURES)}",
        f"Implemented {random.choice(FEATURES)}",
        f"Applied patch for {random.choice(COMPONENTS)}",
        f"Hotfix for {random.choice(SYPTOMS)}",
        f"Refactored {random.choice(COMPONENTS)} for better performance",
        f"Cleaned up {random.choice(COMPONENTS)} code",
        f"Added tests for {random.choice(COMPONENTS)}",
    ]
    return random.choice(templates)

def generate_random_date(start_date, end_date):
    time_diff = end_date - start_date
    random_seconds = random.randint(0, int(time_diff.total_seconds()))
    return start_date + timedelta(seconds=random_seconds)

REPO_PATH = r"C:\Users\User\Desktop\Nexgile-VS-IDE-USA"

def generate_commits(num_commits=800):
    os.chdir(REPO_PATH)

    start_date = datetime(2025, 11, 1, 0, 0, 0)
    end_date = datetime(2026, 6, 11, 23, 59, 59)

<<<<<<< HEAD
<<<<<<< HEAD
    # Stage all files
    subprocess.run(["git", "add", "-A"], cwd=REPO_PATH)
=======
    # Stage files once
    subprocess.run(['git', 'add', '-A'], cwd=REPO_PATH, capture_output=True)
>>>>>>> 2b6cee5d (Added support for live share)
=======
    # Stage all files first
    subprocess.run(['git', 'add', '-A'], cwd=REPO_PATH, capture_output=True)
>>>>>>> d289d24a (Applied patch for linter)

    print(f"Generating {num_commits} commits...")

    for i in range(num_commits):
        name, email = random.choice(AUTHORS)
        commit_date = generate_random_date(start_date, end_date)
<<<<<<< HEAD
<<<<<<< HEAD
        date_str = commit_date.strftime('%Y-%m-%dT%H:%M:%S')
=======
>>>>>>> d289d24a (Applied patch for linter)

        # Generate commit message
        message = get_random_message()

        # Set git config for author
        subprocess.run(['git', 'config', 'user.name', name], cwd=REPO_PATH, capture_output=True)
        subprocess.run(['git', 'config', 'user.email', email], cwd=REPO_PATH, capture_output=True)

        # Format date for git
        date_str = commit_date.strftime('%Y-%m-%d %H:%M:%S')

<<<<<<< HEAD
        if result.returncode != 0 and "nothing to commit" not in result.stderr:
            print(f"Error: {result.stderr}")
=======
        message = get_random_message()
        date_str = commit_date.strftime('%Y-%m-%d %H:%M:%S')

        # Use bash -c to run the command with environment variables
        env_cmd = f'GIT_AUTHOR_NAME="{name}" GIT_AUTHOR_EMAIL="{email}" GIT_COMMITTER_NAME="{name}" GIT_COMMITTER_EMAIL="{email}" GIT_AUTHOR_DATE="{date_str}" GIT_COMMITTER_DATE="{date_str}" git commit -m "{message}"'

        # Explicitly use bash -c
        subprocess.run(['bash', '-c', env_cmd], cwd=REPO_PATH, capture_output=True)
>>>>>>> 2b6cee5d (Added support for live share)
=======
        # Use cmd /c to run the command with environment variables
        cmd = f'set GIT_AUTHOR_NAME={name}&& set GIT_AUTHOR_EMAIL={email}&& set GIT_COMMITTER_NAME={name}&& set GIT_COMMITTER_EMAIL={email}&& set GIT_AUTHOR_DATE={date_str}&& set GIT_COMMITTER_DATE={date_str}&& git commit -m "{message}"'

        result = subprocess.run(cmd, cwd=REPO_PATH, shell=True, capture_output=True, text=True)

        if result.returncode != 0 and 'nothing to commit' not in result.stderr:
            print(f"Error: {result.stderr[:100]}")
>>>>>>> d289d24a (Applied patch for linter)

        if (i + 1) % 100 == 0:
            print(f"  Created {i + 1}/{num_commits} commits...")

    print(f"Done! Created {num_commits} commits.")

<<<<<<< HEAD
    # Show summary
    subprocess.run(['git', 'shortlog', '-sn'], cwd=REPO_PATH)

=======
>>>>>>> 2b6cee5d (Added support for live share)
if __name__ == "__main__":
    num_commits = 850
    if len(sys.argv) > 1:
        num_commits = int(sys.argv[1])
    generate_commits(num_commits)