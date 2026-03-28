#!/bin/bash
set -e

# Remove lock if exists
rm -f /home/runner/workspace/.git/index.lock

cd /home/runner/workspace

# Configure git identity
git config user.email "agent@replit.com"
git config user.name "Replit Agent"

# Set remote with token
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/supdatta/svm-track.git"

# Add all changes and commit
git add -A
git commit -m "Fix: allow all hosts in Vite, add AI hour suggestions, dynamic projects page" || echo "Nothing new to commit"

# Push
git push origin HEAD:main --force-with-lease || git push origin HEAD:main
echo "Push complete!"
