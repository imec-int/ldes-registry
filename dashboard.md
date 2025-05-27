---
outline: deep
---

<script setup>
import { data as uptimeData } from './uptime.data.js'
import { data as metaData } from './metadata.data.js'
import { data as benchData } from './throughput.data.js'
const moment = uptimeData.moment
const endpoints = uptimeData.endpoints
//const endpointsWithMetadata = [];
const endpointsWithMetadata = metaData.endpoints;
const endpointsWithThroughput = benchData.endpoints

for (let ix = 0; ix < endpoints.length; ix++) {
    const metadata = endpointsWithMetadata.filter(m => m.url === endpoints[ix].url)[0]
    if (endpoints[ix].status === 'offline') {
        // do not attach throughput data to offline endpoints
        continue
    }

    if (metadata && metadata.status === 'warning') {
        endpoints[ix].status = 'warning';
        endpoints[ix].warning = metadata.warning;
    }
    
    if (metadata && metadata.mermaidUrl && metadata.mermaidUrl.length > 0) {
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
// sort the items by status (online first, then warning and offline last)
endpoints.sort((a, b) => {
    if (a.status === 'offline' && b.status === 'warning') return 1;
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return 0;
});
</script>

<div v-for="endpoint of endpoints">
    <article :class="{'custom-block': true, 'danger': endpoint.status === 'offline', 'warning': endpoint.status === 'warning', 'info': endpoint.status === 'online'}">
        <h2 style="margin-top: 0; border-top: 0;">{{ endpoint.title }}</h2>
        <h3>Info</h3>
        <p><span>{{ endpoint.status === "offline" ? "⭕" : endpoint.status === "warning" ? "⚠️" : "✅" }}</span> Status {{ endpoint.status }}</p>
        <p><span>🔗</span> <a :href="endpoint.url" target="_blank">{{ endpoint.url }}</a></p>
        <p v-if="endpoint.error">{{ endpoint.error }}</p>
        <p v-if="endpoint.metadata"><span>🧜‍♀️</span> <a :href="endpoint.metadata.mermaidUrl" target="_blank">Shape topology </a></p>
        <p v-if="endpoint.warning">{{ endpoint.warning }}</p>
        <h3 v-if="endpoint.throughput">Throughput</h3>
        <table v-if="endpoint.throughput">
            <thead>
                <tr>
                    <!-- <th>Duration (seconds)</th>
                    <th>Members</th> -->
                    <!-- <th>Quads</th> -->
                    <th>Quads/s</th>
                    <th>Members/s</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <!-- <td>{{ endpoint.throughput.durationSec }}</td>
                    <td>{{ endpoint.throughput.members }}</td> -->
                    <!-- <td>{{ endpoint.throughput.quads }}</td> -->
                    <td>{{ endpoint.throughput.throughputQuands }}</td>
                    <td>{{ endpoint.throughput.throughputMembers }}</td>
                </tr>
            </tbody>
        </table>
        <details v-if="endpoint.throughput" class="details custom-block">
            <summary>Benchmark details</summary>
            <table v-if="endpoint.throughput">
                <thead>
                    <tr>
                        <th>Duration (seconds)</th>
                        <th>Members</th>
                        <th>Quads</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ endpoint.throughput.durationSec }}</td>
                        <td>{{ endpoint.throughput.members }}</td>
                        <td>{{ endpoint.throughput.quads }}</td>
                    </tr>
                </tbody>
            </table>
        </details>
    </article>
</div>

::: info
The measurements were last updated on :stopwatch: {{ moment.toLocaleString('en-GB', { timeZone: 'Europe/Brussels' }) }}
:::
