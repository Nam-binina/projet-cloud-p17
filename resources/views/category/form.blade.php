@extends('adminlte::page')

@section('title', isset($category) ? 'Modifier une catégorie' : 'Créer une catégorie')

@section('content_header')
    <h1>Gestion des catégories</h1>
@stop

@section('content')
    <div class="row">
        <div class="col-lg-8">
            <div class="card card-primary">
                <div class="card-header">
                    <h3 class="card-title mb-0">{{ isset($category) ? 'Modifier la catégorie' : 'Créer une catégorie' }}</h3>
                </div>

                <form action="{{ isset($category) ? url('/categories/modifier/' . $category->id) : url('/categories') }}" method="post">
                    @csrf
                    <div class="card-body">
                        @if ($errors->any())
                            <div class="alert alert-danger">
                                <ul class="mb-0">
                                    @foreach ($errors->all() as $error)
                                        <li>{{ $error }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        @endif

                        <div class="form-group">
                            <label for="nom">Nom</label>
                            <input type="text" name="nom" id="nom" class="form-control"
                                   value="{{ old('name', isset($category) ? $category->name : '') }}" required>
                        </div>

                        <div class="form-group">
                            <label for="description">Description</label>
                            <input type="text" name="description" id="description" class="form-control"
                                   value="{{ old('description', isset($category) ? $category->description : '') }}">
                        </div>

                        <div class="form-group">
                            <label for="slug">Slug</label>
                            <input type="text" name="slug" id="slug" class="form-control"
                                   value="{{ old('slug', isset($category) ? $category->slug : '') }}">
                        </div>
                    </div>

                    <div class="card-footer d-flex justify-content-between">
                        <a href="{{ url('/categories') }}" class="btn btn-default">
                            <i class="fas fa-arrow-left mr-1"></i> Retour
                        </a>
                        <button type="submit" class="btn btn-primary">
                            {{ isset($category) ? 'Modifier' : 'Créer' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@stop
