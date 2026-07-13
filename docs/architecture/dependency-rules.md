# Dependency Rules

## Allowed Dependency Direction

The architecture follows a **layered hexagonal pattern** where dependencies point inward:

```mermaid
flowchart LR
    subgraph P["Presentation"]
        Web["apps/web"]
        Ext["apps/extension"]
    end
    subgraph App["Application"]
        Features["Feature Services"]
    end
    subgraph Dom["Domain"]
        LE["@ielts/learning-engine"]
        ATE["@ielts/ai-tutor-engine"]
    end
    subgraph Ports["Ports"]
        LEPorts["Learning Engine Ports"]
        ATEPorts["AI Tutor Engine Ports"]
    end
    subgraph Infra["Infrastructure"]
        AI["@ielts/ai"]
        Storage["@ielts/storage"]
        Settings["@ielts/settings"]
    end
    subgraph Shared["Shared"]
        Shared["@ielts/shared"]
        Theme["@ielts/theme"]
        UI["@ielts/ui"]
    end

    P --> App
    App --> Dom
    Dom --> Ports
    Ports --> Infra

    P --> Shared
    App --> Shared
    Dom --> Shared
    Ports --> Shared
    Infra --> Shared

    Infra -->|"implements"| Ports
    Dom -->|"depends on abstractions"| Ports
    UI --> Theme
```

## Rules

1. **Presentation** → may depend on Application, Domain, and Shared packages
2. **Application** → may depend on Domain and Shared; should NOT depend on Infrastructure directly
3. **Domain** → depends only on Port abstractions and Shared; must NOT depend on Infrastructure or Presentation
4. **Infrastructure** → implements Port interfaces; may depend on Shared
5. **All layers** → may depend on Shared (types, mappers, value objects)
6. **UI and Theme** → consumed by Presentation only; must not be imported by Domain or Infrastructure

## Current Violations

### Web app imports storage repositories directly

```
apps/web/src/features/dashboard/      → imports DatabaseService (direct Dexie access)
apps/web/src/features/vocabulary/     → imports storage repositories directly
apps/web/src/features/roadmap/        → calls DatabaseService.safeGetAll directly
apps/web/src/services/engineBootstrap.ts  → imports DatabaseService
```

These bypass the engine port interfaces, coupling feature code to the storage implementation. Data access should go through `@ielts/learning-engine` ports (e.g., `VocabularyRepository`, `ProgressRepository`) or `@ielts/ai-tutor-engine` ports.

### Inline AI calls in feature code

```
apps/web/src/features/reading/        → may import callAI directly from @ielts/ai
apps/web/src/features/writing/        → may import callAI directly from @ielts/ai
```

AI calls should be routed through `TutorIntelligencePort` (learning engine) or `TutorAIClient` (AI tutor engine) rather than directly calling `@ielts/ai`.

### Engine bootstrap bypasses port contracts

`engineBootstrap.ts` in `apps/web/src/services/` creates ad-hoc implementations of port interfaces that directly access IndexedDB tables. These adapters are not shared with the extension, leading to duplicate adapter code.

### Extension has its own storage layer

The extension at `apps/extension/src/storage/` re-implements persistence (IndexedDB + chrome.storage) rather than reusing `@ielts/storage` adapters. The `engine-adapters/` subdirectory duplicates adapter logic that already exists in the web app's bootstrap.
