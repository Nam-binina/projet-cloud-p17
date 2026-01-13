@extends('adminlte::page')

@section('title', isset($product) ? 'Modifier un produit' : 'Ajouter un produit')

@section('content_header')
    <h1>{{ isset($product) ? 'Modifier un produit' : 'Ajouter un produit' }}</h1>
@stop

@section('content')
    <div class="card">
        <div class="card-body">

            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            <form
                action="{{ isset($product) 
                    ? route('products.update', $product->id) 
                    : route('products.store') }}"
                method="POST"
            >
                @csrf
                @if(isset($product))
                    @method('PUT')
                @endif

                <div class="form-group">
                    <label for="name">Nom du produit</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        class="form-control @error('name') is-invalid @enderror"
                        value="{{ old('name', $product->name ?? '') }}"
                    >
                    @error('name')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows="4"
                        class="form-control @error('description') is-invalid @enderror"
                    >{{ old('description', $product->description ?? '') }}</textarea>
                    @error('description')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="price">Prix</label>
                    <input
                        type="number"
                        step="0.01"
                        name="price"
                        id="price"
                        class="form-control @error('price') is-invalid @enderror"
                        value="{{ old('price', $product->price ?? '') }}"
                    >
                    @error('price')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="category_id">Catégorie</label>
                    <select
                        name="category_id"
                        id="category_id"
                        class="form-control @error('category_id') is-invalid @enderror"
                    >
                        <option value="">-- Sélectionner une catégorie --</option>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}"
                                {{ old('category_id', $product->category_id ?? '') == $category->id ? 'selected' : '' }}>
                                {{ $category->name }}
                            </option>
                        @endforeach
                    </select>
                    @error('category_id')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group form-check">
                    <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        class="form-check-input"
                        {{ old('is_active', $product->is_active ?? true) ? 'checked' : '' }}
                    >
                    <label class="form-check-label" for="is_active">Produit actif</label>
                </div>

                <button type="submit" class="btn btn-success">
                    {{ isset($product) ? 'Mettre à jour' : 'Ajouter le produit' }}
                </button>

                <a href="{{ route('products.index') }}" class="btn btn-secondary ml-2">
                    Annuler
                </a>

            </form>
        </div>
    </div>
@stop
