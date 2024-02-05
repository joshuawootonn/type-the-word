export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { NodeSDK } = await import('@opentelemetry/sdk-node')
        const { OTLPTraceExporter } = await import(
            '@opentelemetry/exporter-trace-otlp-http'
        )
        const { BatchSpanProcessor } = await import(
            '@opentelemetry/sdk-trace-base'
        )
        const { Resource } = await import('@opentelemetry/resources')
        const { SemanticResourceAttributes } = await import(
            '@opentelemetry/semantic-conventions'
        )
        const { getNodeAutoInstrumentations } = await import(
            '@opentelemetry/auto-instrumentations-node'
        )
        const { env } = await import('~/env.mjs')
        const traceExporter = new OTLPTraceExporter({
            url: 'https://api.axiom.co/v1/traces',
            headers: {
                Authorization: `Bearer ${env.NEXT_PUBLIC_AXIOM_TOKEN}`,
                'X-Axiom-Dataset': env.NEXT_PUBLIC_AXIOM_DATASET,
            },
        })

        // Define the resource attributes, in this case, setting the service name for the traces
        const resource = new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: 'type-the-word', // Name for the tracing service
        })

        // Create a NodeSDK instance with the configured span processor, resource, and auto-instrumentations
        const sdk = new NodeSDK({
            spanProcessor: new BatchSpanProcessor(traceExporter), // Use BatchSpanProcessor for batching and sending traces
            resource: resource, // Attach the defined resource to provide additional context
            instrumentations: [getNodeAutoInstrumentations()], // Automatically instrument common Node.js modules
        })

        // Start the OpenTelemetry SDK
        sdk.start()
    }
}
