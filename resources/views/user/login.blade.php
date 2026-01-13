@extends('adminlte::auth.auth-page', ['authType' => 'login'])

@section('adminlte_css_pre')
    <link rel="stylesheet" href="{{ asset('vendor/icheck-bootstrap/icheck-bootstrap.min.css') }}">
@stop

@section('auth_header', 'Connexion')

@section('auth_body')
    @if(session('status'))
        <x-alert type="success" :message="session('status')" />
    @endif

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <div class="input-group mb-3">
            <input type="email" id="email" name="email" class="form-control" value="{{ old('email') }}" placeholder="Adresse email" required autofocus>
            <div class="input-group-append">
                <div class="input-group-text">
                    <span class="fas fa-envelope"></span>
                </div>
            </div>
        </div>

        <div class="input-group mb-3">
            <input type="password" id="password" name="password" class="form-control" placeholder="Mot de passe" required>
            <div class="input-group-append">
                <div class="input-group-text">
                    <span class="fas fa-lock"></span>
                </div>
            </div>
        </div>

        <div class="row align-items-center mb-3">
            <div class="col-7">
                <div class="icheck-primary">
                    <input class="form-check-input" type="checkbox" name="remember" id="remember">
                    <label class="form-check-label" for="remember">
                        Se souvenir de moi
                    </label>
                </div>
            </div>
            <div class="col-5 text-end">
                <button type="submit" class="btn btn-primary btn-block">Se connecter</button>
            </div>
        </div>
    </form>
@stop

@section('auth_footer')
    <p class="my-0">
        <a href="#">Mot de passe oublié ?</a>
    </p>
@stop
