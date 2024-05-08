---
outline: deep
---

<script setup>
import { data as uptimeData } from './uptime.data.js'
import { data as metaData } from './metadata.data.js'
const endpoints = uptimeData.endpoints
const endpointsWithMetadata = metaData.endpoints

for (let ix = 0; ix < endpoints.length; ix++) {
    const metadata = endpointsWithMetadata.filter(m => m.url === endpoints[ix].url)[0]
    if (metadata && metadata.status === 'online' && metadata.mermaidUrl && metadata.mermaidUrl.length > 0) {
        endpoints[ix].metadata = metadata
    } else {
        endpoints[ix].metadata = null
    }
}
</script>

<div v-for="endpoint of endpoints">
    <article :class="{'custom-block': true, 'danger': endpoint.status === 'offline', 'info': endpoint.status !== 'offline'}">
        <a :href="endpoint.url" target="_blank">{{ endpoint.url }}</a>
        <p><span>{{ endpoint.status === "offline" ? "⭕" : "✅" }}</span> {{ endpoint.status }}</p>
        <p v-if="endpoint.error">{{ endpoint.error }}</p>
        <a v-if="endpoint.metadata" :href="endpoint.metadata.mermaidUrl" target="_blank">🧜‍♀️ Shape topology </a>
    </article>
</div>
