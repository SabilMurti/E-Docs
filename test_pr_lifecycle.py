import requests
import json
import time
import sys

# Configuration
BASE_URL = "http://localhost:8000/api"
# Token manual atau login (di lingkungan dev biasanya kita bisa asumsikan user ID 1)
# Untuk keperluan test ini, kita asumsikan server jalan dan ada user aktif.
# Jika butuh login, tambahkan di sini.

def test_pr_workflow():
    print("🚀 Starting Pull Request Feature Test...")
    
    # 1. Login/Get Token (Assume dev environment has setup)
    # Ini dummy token, sesuaikan jika server butuh Auth beneran
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    
    # Get Site
    sites_res = requests.get(f"{BASE_URL}/sites", headers=headers)
    if sites_res.status_code != 200:
        print("❌ Failed to list sites. Make sure server is running.")
        return
    
    site = sites_res.json()['data'][0]
    site_id = site['id']
    print(f"✅ Found Site: {site['name']} ({site_id})")

    # Get Branches
    branches_res = requests.get(f"{BASE_URL}/sites/{site_id}/branches", headers=headers)
    branches = branches_res.json()['data']
    main_branch = next(b for b in branches if b['name'] == 'main')
    
    # Create Feature Branch
    branch_name = f"test-feature-{int(time.time())}"
    print(f"🌿 Creating branch: {branch_name}...")
    create_branch_res = requests.post(f"{BASE_URL}/sites/{site_id}/branches", json={"name": branch_name}, headers=headers)
    feature_branch = create_branch_res.json()['data']

    # 2. Modify Page on Main
    pages_res = requests.get(f"{BASE_URL}/sites/{site_id}/pages?branch_id={main_branch['id']}", headers=headers)
    page = pages_res.json()['data'][0]
    page_id = page['id']
    logical_id = page['logical_id']

    print(f"📝 Modifying page '{page['title']}' on main to create conflict...")
    requests.post(f"{BASE_URL}/sites/{site_id}/pages/{page_id}/commits", json={
        "branch_id": main_branch['id'],
        "message": "Modify on main",
        "title": page['title'],
        "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Content on main"}]}]}
    }, headers=headers)

    # 3. Modify Same Page on Feature
    # Find the page on feature branch
    feature_pages_res = requests.get(f"{BASE_URL}/sites/{site_id}/pages?branch_id={feature_branch['id']}", headers=headers)
    f_page = next(p for p in feature_pages_res.json()['data'] if p['logical_id'] == logical_id)
    
    print(f"📝 Modifying same page on {branch_name}...")
    requests.post(f"{BASE_URL}/sites/{site_id}/pages/{f_page['id']}/commits", json={
        "branch_id": feature_branch['id'],
        "message": "Modify on feature",
        "title": f_page['title'],
        "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Content on feature"}]}]}
    }, headers=headers)

    # 4. Create Pull Request
    print("🔀 Creating Pull Request...")
    pr_res = requests.post(f"{BASE_URL}/sites/{site_id}/pulls", json={
        "title": "Test PR Conflict",
        "source_branch_id": feature_branch['id'],
        "target_branch_id": main_branch['id']
    }, headers=headers)
    pr = pr_res.json()['data']
    pr_id = pr['id']

    # 5. Check for Conflicts
    print("🔍 Checking PR status (expecting conflict)...")
    pr_detail = requests.get(f"{BASE_URL}/sites/{site_id}/pulls/{pr_id}", headers=headers).json()
    has_conflict = any(c['has_conflict'] for c in pr_detail['changes'])
    
    if has_conflict:
        print("✅ Conflict detected correctly.")
    else:
        print("❌ Failed: Conflict NOT detected!")
        return

    # 6. Resolve Conflict
    print("🛠 Resolving conflict...")
    resolve_res = requests.post(f"{BASE_URL}/sites/{site_id}/pulls/{pr_id}/resolve", json={
        "resolutions": [{
            "logical_id": logical_id,
            "title": "Resolved Title",
            "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Resolved Content"}]}]}
        }]
    }, headers=headers)
    
    if resolve_res.status_code == 200:
        print("✅ Conflict resolved via API.")
    else:
        print(f"❌ Failed to resolve conflict: {resolve_res.text}")
        return

    # 7. Merge PR
    print("🤝 Merging PR...")
    merge_res = requests.post(f"{BASE_URL}/sites/{site_id}/pulls/{pr_id}/merge", headers=headers)
    
    if merge_res.status_code == 200:
        print("🎉 SUCCESS! Pull Request merged without errors.")
    else:
        print(f"❌ Merge failed: {merge_res.text}")

if __name__ == "__main__":
    test_pr_workflow()
