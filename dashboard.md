---
outline: deep
---

<script setup>
import { data as updatimeData } from './uptime.data.js'
import { data as metadataData } from './metadata.data.js'
const endpoints = updatimeData.endpoints
const metadata = metadataData.endpoints

for (let ix = 0; ix < endpoints.length; ix++) {
    const metadata = metadata.filter(m => m.url === endpoints[ix].url)[0]
    if (metadata && metadata.status === 'online') {
        endpoints[ix].metadata = metadata
    }
}
</script>

<div v-for="endpoint of endpoints">
    <article :class="{'custom-block': true, 'danger': endpoint.status === 'offline', 'info': endpoint.status !== 'offline'}">
        <a :href="endpoint.url" target="_blank">{{ endpoint.url }}</a><a v-if="endpoint.metadata" :href="endpoint.metadata.mermaidUrl" target="_blank"> Collection Shape 🔎</a>
        <p><span>{{ endpoint.status === "offline" ? "⭕" : "✅" }}</span> {{ endpoint.status }}</p>
        <p v-if="endpoint.error">{{ endpoint.error }}</p>
    </article>
</div>
