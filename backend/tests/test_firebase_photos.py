import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Nota: Este teste usa a versão SQL + Firebase integrada (firebase_locations.py)
# Ele simula envio de fotos via JSON de metadados (não upload binário real Firebase Storage)

def test_create_location_with_firebase_photos():
    photos = [
        {
            "filename": "foto1.jpg",
            "originalFilename": "foto1.jpg",
            "url": "https://example.com/foto1.jpg",
            "storageKey": "locations/foto1.jpg",
            "width": 800,
            "height": 600,
            "fileSize": 12345,
            "caption": "Foto 1",
            "isPrimary": True,
            "order": 0
        },
        {
            "filename": "foto2.jpg",
            "originalFilename": "foto2.jpg",
            "url": "https://example.com/foto2.jpg",
            "storageKey": "locations/foto2.jpg",
            "width": 800,
            "height": 600,
            "fileSize": 22345,
            "caption": "Foto 2",
            "isPrimary": False,
            "order": 1
        }
    ]

    data = {
        "title": "Locação Teste Firebase",
        "firebase_photos": json.dumps(photos)
    }

    response = client.post("/api/v1/locations/firebase", data=data)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body.get("title") == "Locação Teste Firebase"

    # Recuperar fotos
    location_id = body.get("id")
    photos_resp = client.get(f"/api/v1/locations/{location_id}/firebase-photos")
    assert photos_resp.status_code == 200, photos_resp.text
    photos_list = photos_resp.json()
    assert len(photos_list) == 2
    # Verificar sort_order aplicado
    orders = [p["sort_order"] if "sort_order" in p else p.get("order") for p in photos_list]
    assert orders == [0, 1]


def test_add_firebase_photos_existing_location():
    # Criar sem fotos
    create_resp = client.post("/api/v1/locations/firebase", data={"title": "Sem Fotos", "firebase_photos": json.dumps([])})
    assert create_resp.status_code == 200
    loc_id = create_resp.json()["id"]

    new_photos = [
        {
            "filename": "nova1.jpg",
            "originalFilename": "nova1.jpg",
            "url": "https://example.com/nova1.jpg",
            "storageKey": "locations/nova1.jpg",
            "width": 400,
            "height": 300,
            "fileSize": 5000,
            "caption": "Nova 1",
            "isPrimary": True,
            "order": 0
        }
    ]

    add_resp = client.post(
        f"/api/v1/locations/{loc_id}/firebase-photos",
        data={"firebase_photos": json.dumps(new_photos)}
    )
    assert add_resp.status_code == 200, add_resp.text
    assert "fotos adicionadas" in add_resp.json()["message"].lower()

    photos_resp = client.get(f"/api/v1/locations/{loc_id}/firebase-photos")
    assert photos_resp.status_code == 200
    lista = photos_resp.json()
    assert len(lista) == 1
    assert lista[0]["caption"] == "Nova 1"
