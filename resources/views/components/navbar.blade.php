<nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
    <a class="navbar-brand fw-bold" href="{{ url('/') }}">
        {{ config('app.name') }}
    </a>

    <div class="ms-auto d-flex align-items-center">
        <div class="me-3 text-muted">
            {{ Auth::user()->name ?? 'Utilisateur' }}
        </div>

        <a href="#"
           onclick="event.preventDefault(); document.getElementById('logout-form').submit();"
           class="btn btn-sm btn-outline-secondary">
            Déconnexion
        </a>

        <form id="logout-form" method="POST" action="#" class="d-none">
            @csrf
        </form>
    </div>
</nav>
