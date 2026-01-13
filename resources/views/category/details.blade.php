@extends('adminlte::page')

@section('title','Détails catégorie')


@section('content_header')
    <h1>Détails de la catégorie</h1>
@stop

@section('content')
    @isset($category)
        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3 class="card-title mb-0">{{ $category->name }} <small class="text-muted">({{ $category->slug }})</small></h3>
                        <div class="card-tools">
                            <a href="{{ url('/categories/modifier/' . $category->id) }}" class="btn btn-sm btn-warning">
                                <i class="fas fa-edit mr-1"></i> Modifier
                            </a>
                            <form action="{{ url('/categories/supprimer/' . $category->id) }}" method="post" class="d-inline" onsubmit="return confirm('Voulez-vous vraiment supprimer cette catégorie ?');">
                                @csrf
                                <button type="submit" class="btn btn-sm btn-danger">
                                    <i class="fas fa-trash mr-1"></i> Supprimer
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-0">{{ $category->description }}</p>
                    </div>
                </div>
            </div>
        </div>
    @else
        <div class="alert alert-info">
            Catégorie introuvable.
        </div>
    @endisset
@stop
