@extends('adminlte::page')

@section('title', 'Produits')

@section('content_header')
    <div class="d-flex justify-content-between align-items-center">
        <div>
            <h1 class="mb-0">Catalogue produits</h1>
            <p class="text-muted">Liste paginée des produits disponibles</p>
        </div>
        <div>
            <a href="{{ url('/categories') }}" class="btn btn-outline-secondary">
                <i class="fas fa-tags mr-1"></i> Gérer les catégories
            </a>
        </div>
    </div>

    @php
    $filters = [
        [
            'name' => 'category',
            'label' => 'Toutes les catégories',
            'options' => $categories->pluck('name', 'id')
        ]
    ];
    @endphp

    <x-search-bar :filters="$filters" :search="route('products.index')" />
@stop

@section('content')
@if(session('success'))
<div class="alert alert-success">
    {{ session('success') }}
</div>
@endif
    <div class="card">
        <div class="card-header">
            <form method="GET" class="d-flex flex-wrap gap-2 align-items-center">
                <label class="mb-0 me-2" for="per_page">Éléments par page</label>
                <select name="per_page" id="per_page" class="form-control w-auto" onchange="this.form.submit()">
                    @foreach([10, 25, 50] as $size)
                        <option value="{{ $size }}" @selected(request('per_page', 10) == $size)>{{ $size }}</option>
                    @endforeach
                </select>
            </form>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-striped mb-0">
                    <thead>
                        <tr>
                            @php
                            $sort = request('sort', 'id');
                            $direction = request('direction', 'asc');
                            @endphp
                        
                        <th>
                            <a href="{{ route('products.index', ['sort' => 'id', 'direction' => $sort === 'id' && $direction === 'asc' ? 'desc' : 'asc']) }}">
                                #
                                @if($sort === 'id') <i class="fas fa-sort-{{ $direction === 'asc' ? 'up' : 'down' }}"></i> @endif
                            </a>
                        </th>
                        
                        <th>
                            <a href="{{ route('products.index', ['sort' => 'name', 'direction' => $sort === 'name' && $direction === 'asc' ? 'desc' : 'asc']) }}">
                                Produit
                                @if($sort === 'name') <i class="fas fa-sort-{{ $direction === 'asc' ? 'up' : 'down' }}"></i> @endif
                            </a>
                        </th>
                        
                        <th>
                            <a href="{{ route('products.index', ['sort' => 'category_id', 'direction' => $sort === 'category_id' && $direction === 'asc' ? 'desc' : 'asc']) }}">
                                Catégorie
                                @if($sort === 'category_id') <i class="fas fa-sort-{{ $direction === 'asc' ? 'up' : 'down' }}"></i> @endif
                            </a>
                        </th>
                        
                        <th class="text-end">
                            <a href="{{ route('products.index', ['sort' => 'price', 'direction' => $sort === 'price' && $direction === 'asc' ? 'desc' : 'asc']) }}">
                                Prix
                                @if($sort === 'price') <i class="fas fa-sort-{{ $direction === 'asc' ? 'up' : 'down' }}"></i> @endif
                            </a>
                        </th>
                        
                        <th class="text-center">
                            <a href="{{ route('products.index', ['sort' => 'is_active', 'direction' => $sort === 'is_active' && $direction === 'asc' ? 'desc' : 'asc']) }}">
                                Statut
                                @if($sort === 'is_active') <i class="fas fa-sort-{{ $direction === 'asc' ? 'up' : 'down' }}"></i> @endif
                            </a>
                        </th>
                        
                        <th>
                            <a href="{{ route('products.index', ['sort' => 'published_at', 'direction' => $sort === 'published_at' && $direction === 'asc' ? 'desc' : 'asc']) }}">
                                Publication
                                @if($sort === 'published_at') <i class="fas fa-sort-{{ $direction === 'asc' ? 'up' : 'down' }}"></i> @endif
                            </a>
                        </th>
                        
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($products as $product)
                            <tr>
                                <td>{{ $product->id }}</td>
                                <td>
                                    <div class="fw-semibold">{{ $product->name }}</div>
                                </td>
                                <td>{{ $product->category?->name ?? '—' }}</td>
                                <td class="text-end">{{ number_format($product->price, 2, ',', ' ') }} €</td>
                                <td class="text-center">
                                    <span class="badge bg-{{ $product->is_active ? 'primary' : 'secondary' }}">
                                        {{ $product->is_active ? 'Actif' : 'Inactif' }}
                                    </span>
                                </td>
                                <td>{{ optional($product->published_at)->format('d/m/Y') ?? '—' }}</td>
                                <th><a href="{{ route('products.details',$product->id) }}">details</a></th>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center p-4 text-muted">Aucun produit disponible.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card-footer d-flex justify-content-between align-items-center">
            <div class="text-muted small">
                Affiche {{ $products->firstItem() }}–{{ $products->lastItem() }} sur {{ $products->total() }} produits
            </div>
            <div class="d-flex justify-content-center">
                {{ $products->links('pagination::bootstrap-4') }}
            </div>
        </div>
    </div>
@stop
