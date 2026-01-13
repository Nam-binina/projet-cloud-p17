<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-0">{{ $title }}</h2>

        @if ($subtitle)
            <div class="text-muted small mt-1">
                {{ $subtitle }}
            </div>
        @endif
    </div>

    <div class="d-flex gap-2">
        {{ $actions ?? '' }}
    </div>
</div>
