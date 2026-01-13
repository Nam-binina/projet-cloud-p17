@props([
    'title' => config('app.name', 'Mon Application'),
    'brand' => config('app.name', 'Mon Application'),
    'brandUrl' => url('/'),
    'navLinks' => [],
    'sidebarItems' => [],
    'showSidebar' => true,
    'containerClass' => null,
])

@php
    $defaultNavLinks = [
        ['label' => 'Accueil', 'href' => url('/')],
        ['label' => 'Catégories', 'href' => url('/categories')],
        ['label' => 'Contact', 'href' => url('/contact')],
    ];

    $defaultSidebarItems = [
        ['label' => 'Tableau de bord', 'href' => url('/dashboard')],
        ['label' => 'Catégories', 'href' => url('/categories')],
        ['label' => 'Profil', 'href' => url('/profile')],
        ['label' => 'Paramètres', 'href' => url('/settings')],
    ];

    $computedNavLinks = !empty($navLinks) ? $navLinks : $defaultNavLinks;
    $computedSidebarItems = !empty($sidebarItems) ? $sidebarItems : $defaultSidebarItems;
    $computedContainerClass = $containerClass ?? ($showSidebar ? 'container-fluid' : 'container');
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">

    @stack('styles')
</head>
<body class="bg-body-tertiary" style="font-family: 'Inter', sans-serif;">
    <x-navbar :brand="$brand" :brand-url="$brandUrl" :links="$computedNavLinks" />

    <div class="min-vh-100 d-flex flex-column">
        <div class="flex-grow-1 py-4">
            <div class="{{ $computedContainerClass }}">
                @if($showSidebar)
                    <div class="row g-4">
                        <aside class="col-12 col-md-3 col-lg-2">
                            @isset($sidebar)
                                {{ $sidebar }}
                            @else
                                <x-sidebar :title="$brand" :items="$computedSidebarItems" />
                            @endisset
                        </aside>
                        <main class="col-12 col-md-9 col-lg-10">
                            {{ $slot }}
                        </main>
                    </div>
                @else
                    <main>
                        {{ $slot }}
                    </main>
                @endif
            </div>
        </div>

        <x-footer />
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    @stack('scripts')
</body>
</html>
