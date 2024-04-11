---
outline: deep
---

<script setup>
// import { data } from './throughput.data.js'
// const endpoints = data.endpoints
const endpoints = []
</script>

<div v-for="endpoint of endpoints">
    <article :class="{'custom-block': true, 'danger': endpoint.status === 'offline', 'info': endpoint.status !== 'offline'}">
        <a :href="endpoint.url" target="_blank">{{ endpoint.url }}</a>
        <table v-if="endpoint.status === 'online'">
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
                    <td>{{ endpoint.durationSec }}</td>
                    <td>{{ endpoint.members }}</td>
                    <td>{{ endpoint.quads }}</td>
                    <td>{{ endpoint.throughputQuands }}</td>
                    <td>{{ endpoint.throughputMembers }}</td>
                </tr>
            </tbody>
        </table>
        <p v-if="endpoint.error">{{ endpoint.error }}</p>
        <p v-if="endpoint.status === 'unknown'">Not measured</p>
    </article>
</div>
