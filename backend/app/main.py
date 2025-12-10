from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.responses import RedirectResponse
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api.v1.endpoints import visits_router, projects_router, locations_router, users_router, setup_router, quick_setup, auth, project_location_stages_router, project_locations_router, agenda_events, suppliers, tags_router, notifications_router, custom_filters_router
from .api.v1.endpoints import presentations as presentations_router
from .routers.export import router as export_router
from .routers.dashboard import router as dashboard_router
from .core.database import create_tables

# Criar aplicação FastAPI
class UTF8JSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return super().render(content)

import traceback

app = FastAPI(
    title="Cinema ERP - Sistema de Gestão de Locações",
    description="Sistema completo para gestão de projetos, locações e agenda de visitas para cinema e publicidade",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=UTF8JSONResponse
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 Erro não tratado em {request.url}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "Erro interno do servidor", "detail": str(exc)},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler for HTTPException that ensures CORS headers are always present"""
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    # Add CORS headers manually
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

def get_api_key_dependency(request: Request):
    import os
    # Ignorar validação em preflight CORS
    if request.method.upper() == "OPTIONS":
        return None
    required_key = os.getenv("API_KEY")
    if not required_key:
        return None  # Autenticação desativada
    provided = request.headers.get("X-API-Key")
    if provided != required_key:
        raise HTTPException(status_code=401, detail="API key inválida ou ausente")
    return provided

# ProxyHeadersMiddleware removido para evitar incompatibilidade em runtime no Cloud Run.
# Cloud Run já injeta cabeçalhos X-Forwarded-* e FastAPI/Starlette lida internamente para geração de URLs absolutas em muitos casos.

# Configurar CORS - DEVE ser adicionado ANTES de outros middlewares
# Nota: quando allow_credentials=True, não é permitido usar "*" em allow_origins.
# Portanto, liste explicitamente as origens permitidas (produção + desenvolvimento).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Todos os métodos incluindo OPTIONS
    allow_headers=["*"],  # Todos os headers
    expose_headers=["*"],  # Expor todos os headers na resposta
)



# Forçar HTTPS (apenas se vier http e header indicar que conexão original era https)
_FORCE_HTTPS_SETTING = os.getenv("FORCE_HTTPS_REDIRECT")
if _FORCE_HTTPS_SETTING is None:
    FORCE_HTTPS_REDIRECT = None  # modo automático
else:
    FORCE_HTTPS_REDIRECT = _FORCE_HTTPS_SETTING.strip().lower() in {"1", "true", "on", "yes"}


def _is_local_host(host: str | None) -> bool:
    if not host:
        return False
    host = host.lower()
    return host.startswith("127.0.0.1") or host.startswith("localhost") or host.startswith("0.0.0.0")


@app.middleware("http")
async def enforce_https_and_hsts(request: Request, call_next):
    proto_header = request.headers.get("x-forwarded-proto")
    proto = proto_header or request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")

    # Decidir se devemos redirecionar para HTTPS
    should_redirect = False
    if FORCE_HTTPS_REDIRECT is None:
        # Somente força redirect se estiver atrás de proxy (Cloud Run/Firebase) e a origem não for local
        if proto_header and proto == "http" and not _is_local_host(host):
            should_redirect = True
    elif FORCE_HTTPS_REDIRECT and proto == "http":
        should_redirect = True

    if should_redirect:
        if request.method.upper() == "OPTIONS":
            from starlette.responses import Response
            return Response(status_code=204)
        https_url = request.url.replace(scheme="https")
        return RedirectResponse(url=str(https_url))

    response = await call_next(request)

    # Apenas adicionar HSTS quando a requisição original veio por HTTPS
    if proto == "https" or (proto_header == "https" and not _is_local_host(host)):
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    return response

# Incluir routers
# dependency = [Depends(get_api_key_dependency)]  # TEMPORARIAMENTE DESABILITADO
dependency = []
app.include_router(auth.router, prefix="/api/v1", dependencies=dependency)
app.include_router(setup_router, prefix="/api/v1", dependencies=dependency)
app.include_router(quick_setup.router, prefix="/api/v1", dependencies=dependency)
app.include_router(visits_router, prefix="/api/v1", dependencies=dependency)
app.include_router(projects_router, prefix="/api/v1", dependencies=dependency)
app.include_router(locations_router, prefix="/api/v1", dependencies=dependency)
app.include_router(users_router, prefix="/api/v1", dependencies=dependency)
app.include_router(project_location_stages_router, prefix="/api/v1", dependencies=dependency)
app.include_router(project_locations_router, prefix="/api/v1", dependencies=dependency)
app.include_router(agenda_events.router, prefix="/api/v1/agenda-events", dependencies=dependency)
app.include_router(suppliers.router, prefix="/api/v1/suppliers", dependencies=dependency)

app.include_router(tags_router, prefix="/api/v1", dependencies=dependency)
app.include_router(notifications_router, prefix="/api/v1", dependencies=dependency)
app.include_router(export_router, prefix="/api/v1", dependencies=dependency)
app.include_router(custom_filters_router, prefix="/api/v1/custom-filters", dependencies=dependency)
app.include_router(dashboard_router, prefix="/api/v1", dependencies=dependency)
app.include_router(presentations_router.router, prefix="/api/v1", dependencies=dependency)

# Servir arquivos estáticos (fotos)
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def startup_event():
    """Evento executado na inicialização da aplicação"""
    # Criar tabelas do banco de dados
    create_tables()

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "Cinema ERP - Sistema de Gestão de Locações",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde da aplicação"""
    return {"status": "healthy", "message": "Aplicação funcionando normalmente"}

@app.get("/api/v1/health")
async def health_check_v1():
    """Endpoint de saúde versionado"""
    return {"status": "healthy", "message": "Aplicação funcionando normalmente", "version": "v1"}

@app.get("/health/supabase")
async def health_supabase():
    """Valida conexão com Supabase"""
    from .config.supabase import get_supabase_client

    status = {
        "available": False,
        "url": None,
        "connection": None,
    }

    try:
        supabase = get_supabase_client()
        status["url"] = supabase.supabase_url
        status["available"] = True
        status["connection"] = "ok"
    except Exception as e:
        status["connection"] = f"error: {e}"

    return status
