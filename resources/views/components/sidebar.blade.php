<aside class="sidebar bg-dark text-white vh-100 p-3" style="width: 250px;">
    <ul class="nav flex-column">

        <li class="nav-item mb-2">
            <a class="nav-link text-white {{ request()->is('/') ? 'active fw-bold' : '' }}" href="{{ url('/') }}">
                Tableau de bord
            </a>
        </li>

        <li class="nav-item mb-2">
            <a class="nav-link text-white {{ request()->is('categories*') ? 'active fw-bold' : '' }}" href="/categories">
                Categories
            </a>
        </li>

        <li class="nav-item mb-2">
            <a class="nav-link text-white {{ request()->is('materiels*') ? 'active fw-bold' : '' }}" href="#">
                Matériels
            </a>
        </li>

        <li class="nav-item mb-2">
            <a class="nav-link text-white {{ request()->is('users*') ? 'active fw-bold' : '' }}" href="#">
                Utilisateurs
            </a>
        </li>

    </ul>
</aside>
