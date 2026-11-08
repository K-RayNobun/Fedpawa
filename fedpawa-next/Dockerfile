FROM node:22-alpine

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Interrupteur de mise en service de la signature électronique.
# Défaut = false : tant que la valeur n'est pas passée explicitement au build,
# l'entrée de navigation et les pages de signature restent invisibles.
ARG NEXT_PUBLIC_SIGNATURE_ENABLED=false
ENV NEXT_PUBLIC_SIGNATURE_ENABLED=$NEXT_PUBLIC_SIGNATURE_ENABLED

# Interrupteur de la mesure d'audience navigateur (public/analytics-collect.js,
# publiee vers /collect). Défaut = false : aucune mesure n'est envoyée tant que
# la valeur n'est pas passée explicitement au build.
ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false
ENV NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
