#!/usr/bin/perl
use strict;
use warnings;

my $file = 'swarm/src-tauri/src/lib.rs';
open(my $fh, '<', $file) or die "Cannot open: $!";
my $content = do { local $/; <$fh> };
close($fh);

# Fix 1: -ilc -> -lc
$content =~ s/\.arg\("-ilc"\)/.arg("-lc")/g;

# Fix 2: echo -n $PATH -> printf '%s' "$PATH"
$content =~ s/\.arg\("echo -n \$PATH"\)/.arg("printf '%s' \\"\$PATH\\"")/g;

# Fix 3: path_str -> raw_str and add guard
$content =~ s/let path_str = String::from_utf8_lossy\(&out\.stdout\)/let raw_str = String::from_utf8_lossy(&out.stdout)/g;

# Fix 4: error messages
$content =~ s/println!\("\[Rust\] login shell PATH probe exited non-zero: \{\:\?\}", out\.status\)/println!("[Rust] login shell PATH probe exited non-zero")/g;
$content =~ s/println!\("\[Rust\] login shell PATH probe failed to run: \{e:\?\}"\)/println!("[Rust] login shell PATH probe failed: {e:?}")/g;

open($fh, '>', $file) or die "Cannot write: $!";
print $fh $content;
close($fh);

print "Basic fixes applied!\n";
