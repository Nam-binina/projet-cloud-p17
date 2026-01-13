<footer class="bg-white border-top py-3 px-4 text-muted small mt-auto">
    <div class="d-flex justify-content-between">
        <div>
            © {{ date('Y') }} - {{ config('app.name') }}
        </div>
        <div>
            Version {{ config('app.version', '1.0.0') }}
        </div>
    </div>
</footer>
