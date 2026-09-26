import re
import os

def apply_replacements(content, replacements):
    """Apply all replacements simultaneously using regex word boundaries."""
    # Sort by length descending to match longer patterns first
    sorted_repls = sorted(replacements, key=lambda x: len(x[0]), reverse=True)

    # Build a single regex pattern that matches any of the old strings
    def make_replacer(replacements):
        patterns = []
        for old, new in replacements:
            # Escape special regex chars in the old string
            escaped = re.escape(old)
            patterns.append((escaped, new))

        # Create a single regex that matches any pattern
        combined = '|'.join(p[0] for p in patterns)
        pattern = re.compile(combined)

        def replacer(match):
            matched_text = match.group(0)
            for old_pattern, new_text in patterns:
                if re.fullmatch(old_pattern, matched_text):
                    return new_text
            return matched_text

        return replacer

    replacer = make_replacer(sorted_repls)
    return pattern.sub(replacer, content)

# Read original files first, then apply replacements
# Since git checkout didn't work, I need to read the current files and undo the bad replacements

# Actually, let me just rewrite the files from scratch based on the original content I read earlier.
# I'll define the correct content for each file.

# For now, let me read current files and fix the specific issues

def fix_file(filepath, additional_fixes):
    with open(filepath, 'r') as f:
        content = f.read()

    # Apply additional fixes
    for old, new in additional_fixes:
        content = content.replace(old, new)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

# Fix AuthModal.tsx
# The issue: text-slate-400 was replaced to text-slate-500 then text-slate-600
# Need to change some text-slate-600 back to text-slate-500 where original was text-slate-400

# In AuthModal, the original text-slate-400 contexts were:
# - text-slate-400 hover:text-white → text-slate-500 hover:text-slate-800
# - text-[11px] text-slate-400 → text-[11px] text-slate-500
# But currently they're text-slate-600

auth_fixes = [
    # Fix text-slate-600 that should be text-slate-500 (from original text-slate-400)
    # In AuthModal, these specific patterns were text-slate-400 originally
    # The header icon text was text-indigo-400 (not changed)
    # The tab switcher text was text-slate-400 → should be text-slate-500
    # The demo button text was text-indigo-200 → text-indigo-700 (already correct)
    # The "Instant 1-Click Role Login" was text-slate-400 → should be text-slate-500
    # The "Forgot password?" was text-indigo-400 → text-indigo-600 (already correct)
    # The icon labels in inputs were text-slate-500 → text-slate-600 (correct per instructions)
    # The close button was text-slate-400 → text-slate-500
]

# Actually, the simplest approach: I know the exact original content.
# Let me just rewrite all files completely using write tool.
# But that's very tedious. Let me instead fix the specific issues.

# The core problem: text-slate-400 → text-slate-500 → text-slate-600 (double replaced)
# So I need to change some text-slate-600 back to text-slate-500.
# The text-slate-400 that was originally in the file became text-slate-600.
# The text-slate-500 that was originally in the file also became text-slate-600.

# Looking at original AuthModal:
# - text-slate-400 appeared in: close button, header paragraph, tab buttons, demo section title, role button text, labels, OTP section
# - text-slate-500 appeared in: input icons (Mail, Lock, User, Building)
# Both now show as text-slate-600

# The distinction: text-slate-500 was for icons (like <Mail className="...text-slate-500" />)
# and text-slate-400 was for regular text

# After replacement, all text-slate-600 that should be text-slate-500 are wrong
# I need to identify which text-slate-600 should be text-slate-500

# Actually, looking at the instructions again:
# text-slate-400 → text-slate-500 (NOT text-slate-600)
# text-slate-500 → text-slate-600

# So in the output, where I see text-slate-600:
# - If it was originally text-slate-500, it's correct as text-slate-600
# - If it was originally text-slate-400, it should be text-slate-500

# This is impossible to distinguish automatically. I need to manually fix each file.

# Let me take a completely different approach and just write the correct content for each file.
# I'll read the current files and manually correct them.

print("Need to manually fix files. Will use write tool for each file.")
