#!/usr/bin/env python3
"""Test RSS parsing"""

import requests
import xml.etree.ElementTree as ET

def test_rss(url):
    print(f"\n🔍 Testing: {url}")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        response = requests.get(url, headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            # Parse XML
            root = ET.fromstring(response.content)
            print(f"   Root tag: {root.tag}")

            # Try to find items
            items = root.findall('.//item')
            print(f"   Found {len(items)} items")

            if len(items) > 0:
                # Show first item
                first = items[0]
                title = first.find('title')
                print(f"   First item: {title.text if title is not None else 'No title'}")

            # Try Atom format too
            atom_entries = root.findall('.//{http://www.w3.org/2005/Atom}entry')
            print(f"   Found {len(atom_entries)} Atom entries")

        return response.status_code == 200

    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

# Test all RSS feeds
feeds = [
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-customer-support-jobs.rss",
    "https://weworkremotely.com/categories/remote-design-jobs.rss",
    "https://weworkremotely.com/categories/remote-marketing-jobs.rss",
    "https://remote.co/remote-jobs/developer/feed/",
]

for feed in feeds:
    test_rss(feed)

print("\n✅ Test dokončený")
