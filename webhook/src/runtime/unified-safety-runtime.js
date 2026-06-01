import { buildHealthSeed } from "../integrations/health-os-seed.js";
import { buildIdentityContext } from "../integrations/identity-os.js";
import { buildSovereignEnvelope } from "../integrations/sovereign-os.js";
import { listSystemIds } from "../systems/system-catalog.js";

export class UnifiedSafetyRuntime {
  constructor({ logger }) {
    this.logger = logger;
    this.systemIds = listSystemIds();
  }

  healthSummary() {
    return {
      registered_systems: this.systemIds,
      status: "ok",
    };
  }

  handleCheckoutSessionCompleted(event) {
    const envelope = {
      event: {
        id: event.id,
        type: event.type,
      },
      healthSeed: buildHealthSeed(event),
      identity: buildIdentityContext(event),
      sovereign: buildSovereignEnvelope(event),
      systems: this.systemIds,
    };

    this.logger.info("safety_runtime_checkout_processed", {
      event_id: envelope.event.id,
      event_type: envelope.event.type,
      identity_actor: envelope.identity.actorId,
      systems_count: envelope.systems.length,
    });

    return envelope;
  }

  handleUnhandled(event) {
    this.logger.info("safety_runtime_event_unhandled", {
      event_id: event.id,
      event_type: event.type,
    });
  }
}
