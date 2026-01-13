<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. This project ships with a reusable Blade template stack (navbar, sidebar, footer, layout) to help you bootstrap dashboards quickly.

### 🧱 Template rapide (Navbar, Sidebar, Footer, Layout)

| Composant | Description | Utilisation |
|-----------|-------------|-------------|
| `<x-navbar>` | Barre supérieure responsive avec liens configurables et gestion des états de connexion. | `<x-navbar :links="$links" brand="MonApp" />` |
| `<x-sidebar>` | Menu latéral en carte avec états actifs automatiques, zone utilisateur et liens de bas de page. | `<x-sidebar :items="$items" :footer-links="$links" />` |
| `<x-footer>` | Pied de page léger avec liens légaux + icônes sociaux. | `<x-footer :links="$links" :social="$social" />` |
| `<x-layout>` | Layout principal orchestrant Navbar, Sidebar et contenu. Supporte les slots et options dynamiques. | `<x-layout :show-sidebar="false">{{ $slot }}</x-layout>` |

#### Exemple de page

```blade
@extends('layouts.app')

@php($layoutOptions = [
	'showSidebar' => true,
	'sidebarItems' => [
		['label' => 'Dashboard', 'href' => url('/dashboard'), 'active' => request()->is('dashboard')],
		['label' => 'Catégories', 'href' => url('/categories'), 'active' => request()->is('categories*')],
	],
])

@section('title', 'Liste des catégories')

@section('content')
	<h1>Liste des catégories</h1>
	{{-- Votre contenu --}}
@endsection
```

- Vous pouvez définir `$layoutOptions` dans n’importe quelle vue avant `@section` pour ajuster le layout (brand, navLinks, showSidebar, containerClass, etc.).
- Besoin d’un panneau latéral personnalisé ? Déclarez `@section('sidebar')` pour injecter votre propre contenu (par exemple un `<x-sidebar>` avec d’autres links).
- Pour les vues sans sidebar (ex. formulaire de connexion), utilisez `@php($layoutOptions = ['showSidebar' => false])`.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
