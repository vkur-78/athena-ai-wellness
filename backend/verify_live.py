import urllib.request
import json

def verify():
    # 1. Get spaces
    req = urllib.request.Request(
        'http://127.0.0.1:8001/api/thought-garden/spaces',
        headers={'Authorization': 'Bearer guest_token'}
    )
    with urllib.request.urlopen(req) as res:
        spaces = json.loads(res.read().decode())
    print("1. Spaces retrieved successfully:", len(spaces.get('gardens', [])))

    # 2. Create space
    create_req = urllib.request.Request(
        'http://127.0.0.1:8001/api/thought-garden/spaces',
        data=json.dumps({
            'title': 'Live Verification Sanctuary',
            'initial_thought': 'Project deadline worries',
            'initial_tone': 'anxious'
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer guest_token'}
    )
    with urllib.request.urlopen(create_req) as res:
        new_space = json.loads(res.read().decode())
    space_id = new_space['id']
    node_id = new_space['nodes'][0]['id']
    print(f"2. Space created successfully: {space_id} with initial node: {node_id}")

    # 3. Guided Question
    q_req = urllib.request.Request(
        f'http://127.0.0.1:8001/api/thought-garden/{space_id}/guided-question',
        data=json.dumps({
            'thought_content': 'Project deadline worries',
            'emotional_tone': 'anxious'
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer guest_token'}
    )
    with urllib.request.urlopen(q_req) as res:
        question = json.loads(res.read().decode())
    print("3. Guided question generated:", question['question'])

    # 4. Fact vs Story
    fs_req = urllib.request.Request(
        f'http://127.0.0.1:8001/api/thought-garden/{space_id}/fact-story',
        data=json.dumps({
            'thought_content': 'Project deadline worries',
            'observable_fact': 'The report is due at 5pm',
            'mind_story': 'If I submit late my reputation is ruined'
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer guest_token'}
    )
    with urllib.request.urlopen(fs_req) as res:
        fs = json.loads(res.read().decode())
    print("4. Fact vs Story generated reflection:", fs['athena_reflection'][:60] + "...")

    # 5. Release Ritual
    rel_req = urllib.request.Request(
        f'http://127.0.0.1:8001/api/thought-garden/{space_id}/thoughts/{node_id}/release',
        data=json.dumps({
            'readiness': 'release',
            'release_note': 'Letting go of perfectionism'
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer guest_token'}
    )
    with urllib.request.urlopen(rel_req) as res:
        rel = json.loads(res.read().decode())
    print("5. Release blessing received:", rel['athena_blessing'])

    # 6. Session Completion
    comp_req = urllib.request.Request(
        f'http://127.0.0.1:8001/api/thought-garden/{space_id}/complete',
        data=json.dumps({
            'garden_id': space_id,
            'feeling_now': 'lighter',
            'session_duration_seconds': 180
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer guest_token'}
    )
    with urllib.request.urlopen(comp_req) as res:
        comp = json.loads(res.read().decode())
    print("6. Session completion atmospheric weather:", comp['atmosphere_reflection'][:60] + "...")
    print("\nALL 6 ENDPOINTS VERIFIED 100/100 SUCCESSFULLY ON RUNNING SERVER!")

if __name__ == '__main__':
    verify()
