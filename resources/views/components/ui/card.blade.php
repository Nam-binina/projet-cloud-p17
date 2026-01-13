<div class="card {{ $class ?? '' }}">
    @if($title)
        <div class="card-header">
            {{ $title }}
        </div>
    @endif

    <div class="card-body">
        {{ $slot }}
    </div>

    @if($footer)
        <div class="card-footer text-muted">
            {{ $footer }}
        </div>
    @endif
</div>
