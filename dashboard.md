---
outline: deep
---

<script setup>
import { data as uptimeData } from './uptime.data.js'
import { data as metaData } from './metadata.data.js'
import { data as benchData } from './throughput.data.js'
const endpoints = uptimeData.endpoints
const endpointsWithMetadata = metaData.endpoints
const endpointsWithThroughput = benchData.endpoints

for (let ix = 0; ix < endpoints.length; ix++) {
    const metadata = endpointsWithMetadata.filter(m => m.url === endpoints[ix].url)[0]
    if (metadata && metadata.status === 'online' && metadata.mermaidUrl && metadata.mermaidUrl.length > 0) {
        endpoints[ix].metadata = metadata
    } else {
        endpoints[ix].metadata = null
    }

    const throughput = endpointsWithThroughput.filter(m => m.url === endpoints[ix].url)[0]
    if (throughput && throughput.status === 'online') {
        endpoints[ix].throughput = throughput
    } else {
        endpoints[ix].throughput = null
    }
}
</script>

<div v-for="endpoint of endpoints">
    <article :class="{'custom-block': true, 'danger': endpoint.status === 'offline', 'info': endpoint.status !== 'offline'}">
        <a :href="endpoint.url" target="_blank">{{ endpoint.title }}</a>
        <h3>Info</h3>
        <p><span>{{ endpoint.status === "offline" ? "⭕" : "✅" }}</span> {{ endpoint.status }}</p>
        <p v-if="endpoint.error">{{ endpoint.error }}</p>
        <a v-if="endpoint.metadata" :href="endpoint.metadata.mermaidUrl" target="_blank">🧜‍♀️ Shape topology </a>
        <h3 v-if="endpoint.throughput">Throughput</h3>
        <table v-if="endpoint.throughput">
            <thead>
                <tr>
                    <th>Duration (seconds)</th>
                    <th>Members</th>
                    <th>Quads</th>
                    <th>Throughput (Quads/s)</th>
                    <th>Throughput (Members/s)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ endpoint.throughput.durationSec }}</td>
                    <td>{{ endpoint.throughput.members }}</td>
                    <td>{{ endpoint.throughput.quads }}</td>
                    <td>{{ endpoint.throughput.throughputQuands }}</td>
                    <td>{{ endpoint.throughput.throughputMembers }}</td>
                </tr>
            </tbody>
        </table>
    </article>
</div>
