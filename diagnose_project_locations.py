"""
Script para verificar o estado de project_locations, stages e eventos no banco.
"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("📊 DIAGNÓSTICO: Project Locations, Stages e Eventos")
print("=" * 60)

# 1. Verificar projects
print("\n1️⃣ PROJETOS:")
projects = supabase.table("projects").select("*").execute()
print(f"Total de projetos: {len(projects.data)}")
for p in projects.data[:5]:
    print(f"  - ID {p['id']}: {p.get('title', p.get('name', 'Sem nome'))}")

# 2. Verificar project_locations
print("\n2️⃣ PROJECT LOCATIONS:")
project_locations = supabase.table("project_locations").select("*").execute()
print(f"Total de project_locations: {len(project_locations.data)}")

if project_locations.data:
    for pl in project_locations.data[:5]:
        print(f"\n  Project Location ID: {pl['id']}")
        print(f"    Project ID: {pl['project_id']}")
        print(f"    Location ID: {pl['location_id']}")
        print(f"    Rental: {pl.get('rental_start')} → {pl.get('rental_end')}")
        print(f"    Visit Date: {pl.get('visit_date')}")
        print(f"    Technical Visit: {pl.get('technical_visit_date')}")
        print(f"    Filming: {pl.get('filming_start_date')} → {pl.get('filming_end_date')}")
        print(f"    Delivery: {pl.get('delivery_date')}")
else:
    print("  ⚠️ NENHUMA project_location encontrada!")

# 3. Verificar stages
print("\n3️⃣ PROJECT LOCATION STAGES:")
stages = supabase.table("project_location_stages").select("*").execute()
print(f"Total de stages: {len(stages.data)}")

if stages.data:
    # Agrupar por project_location_id
    stages_by_location = {}
    for s in stages.data:
        pl_id = s.get('project_location_id')
        if pl_id not in stages_by_location:
            stages_by_location[pl_id] = []
        stages_by_location[pl_id].append(s)

    print(f"  Distribuição de stages por location:")
    for pl_id, stage_list in stages_by_location.items():
        print(f"    Project Location {pl_id}: {len(stage_list)} stages")
else:
    print("  ⚠️ NENHUMA stage encontrada!")

# 4. Verificar agenda_events
print("\n4️⃣ AGENDA EVENTS (vinculados a project_locations):")
events = supabase.table("agenda_events").select("*").is_("project_location_id", "null").execute()
print(f"Total de eventos SEM project_location_id: {len(events.data)}")

events_with_pl = supabase.table("agenda_events").select("*").not_.is_("project_location_id", "null").execute()
print(f"Total de eventos COM project_location_id: {len(events_with_pl.data)}")

if events_with_pl.data:
    for e in events_with_pl.data[:5]:
        print(f"\n  Evento ID {e['id']}: {e.get('title')}")
        print(f"    Tipo: {e.get('event_type')}")
        print(f"    Project Location ID: {e.get('project_location_id')}")
        print(f"    Data: {e.get('start_date')} → {e.get('end_date')}")

# 5. Verificar projeto específico #7
print("\n5️⃣ PROJETO #7 (Teste):")
try:
    project_7 = supabase.table("projects").select("*").eq("id", 7).execute()
    if project_7.data:
        print(f"  ✅ Projeto existe: {project_7.data[0].get('title', project_7.data[0].get('name'))}")

        # Buscar locações do projeto 7
        pl_7 = supabase.table("project_locations").select("*").eq("project_id", 7).execute()
        print(f"  Locações: {len(pl_7.data)}")

        if pl_7.data:
            for pl in pl_7.data:
                print(f"\n    Location {pl['location_id']}:")
                print(f"      Rental: {pl.get('rental_start')} → {pl.get('rental_end')}")
                print(f"      Datas: visit={pl.get('visit_date')}, filming={pl.get('filming_start_date')}")

                # Buscar stages dessa location
                stages_pl = supabase.table("project_location_stages").select("*").eq("project_location_id", pl['id']).execute()
                print(f"      Stages: {len(stages_pl.data)}")

                # Buscar eventos dessa location
                events_pl = supabase.table("agenda_events").select("*").eq("project_location_id", pl['id']).execute()
                print(f"      Eventos: {len(events_pl.data)}")
        else:
            print("  ⚠️ Projeto #7 NÃO TEM LOCAÇÕES!")
    else:
        print("  ❌ Projeto #7 não encontrado!")
except Exception as e:
    print(f"  ❌ Erro ao buscar projeto #7: {e}")

print("\n" + "=" * 60)
print("FIM DO DIAGNÓSTICO")
print("=" * 60)
