@extends('adminlte::page')

@section('title', 'Détails du produit')

@section('content_header')
    <h1>Détails du produit</h1>
@stop

@section('content')
    <div class="card">
        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            <table class="table table-bordered">
                <tbody>
                    <tr>
                        <th>ID</th>
                        <td>{{ $product->id }}</td>
                    </tr>
                    <tr>
                        <th>Nom</th>
                        <td>{{ $product->name }}</td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>{{ $product->description }}</td>
                    </tr>
                    <tr>
                        <th>Catégorie</th>
                        <td>{{ $product->category ? $product->category->name : '-' }}</td>
                    </tr>
                    <tr>
                        <th>Prix</th>
                        <td>{{ number_format($product->price, 2, ',', ' ') }} €</td>
                    </tr>
                    <tr>
                        <th>Actif</th>
                        <td>{{ $product->is_active ? 'Oui' : 'Non' }}</td>
                    </tr>
                    <tr>
                        <th>Publié le</th>
                        <td>{{ $product->published_at ? $product->published_at->format('d/m/Y H:i') : '-' }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="mt-3">
                <a href="{{ route('products.edit', $product->id) }}" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Modifier
                </a>

                <form action="{{ route('products.destroy', $product->id) }}" method="POST" class="d-inline"
                      onsubmit="return confirm('Voulez-vous vraiment supprimer ce produit ?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger">
                        <i class="fas fa-trash-alt"></i> Supprimer
                    </button>
                </form>
            </div>

        </div>
    </div>
@stop
