FROM php:8.2-fpm

ARG APP_UID=1000
ARG APP_GID=1000

RUN apt-get update && apt-get install -y \
    zip unzip curl git \
    libpng-dev libjpeg-dev libfreetype6-dev \
    libonig-dev libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring gd \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g ${APP_GID} app || true \
    && useradd -u ${APP_UID} -g ${APP_GID} -m -s /bin/bash app || true

RUN sed -i 's/listen = .*/listen = 9000/' /usr/local/etc/php-fpm.d/www.conf

WORKDIR /var/www/html

RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R ${APP_UID}:${APP_GID} /var/www/html/storage /var/www/html/bootstrap || true \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap || true

EXPOSE 9000

USER app

CMD ["php-fpm"]
