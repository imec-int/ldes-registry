---
outline: deep
---

<script setup>
import { data } from './uptime.data.js'
const endpoints = data.endpoints
</script>

<div v-for="endpoint of endpoints">
    <article :class="{'custom-block': true, 'danger': endpoint.status === 'offline', 'info': endpoint.status !== 'offline'}">
        <a :href="endpoint.url" target="_blank">{{ endpoint.url }}</a>
        <p><span>{{ endpoint.status === "offline" ? "⭕" : "✅" }}</span> {{ endpoint.status }}</p>
        <p v-if="endpoint.error">{{ endpoint.error }}</p>
    </article>
</div>
