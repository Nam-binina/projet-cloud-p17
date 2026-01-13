@extends('adminlte::page')

@section('title', 'Inventaire')

@section('content_header')
    <h1>Gestion des catégories</h1>
@stop

@section('content')
    <x-ui.page-header title="Inventaire" subtitle="Gestion des catégories">
        <x-slot:actions>
            <a href="{{ url('/categories/form') }}" class="btn btn-primary">Ajouter une catégorie</a>
        </x-slot:actions>
    </x-ui.page-header>

    <div class="card">
        <div class="card-body">
            @if($categories->isEmpty())
                <div class="alert alert-warning">Aucune catégorie trouvée.</div>
            @else
                <ul class="list-group">
                    @foreach($categories as $category)
                        <li class="list-group-item">
                            <a href="{{ url('/categories/details/'.$category->id) }}">
                                <strong>{{ $category->name }}</strong>
                            </a>
                            ({{ $category->slug }})
                            <br>
                            {{ $category->description }}
                            <br>
                            <small>Nombre de produits : {{ $category->products_count }}</small>
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>
    </div>
@stop
