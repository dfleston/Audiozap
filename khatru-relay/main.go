package main

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/fiatjaf/khatru"
	"github.com/fiatjaf/khatru/policies"
	"github.com/nbd-wtf/go-nostr"
)

// CONFIG: Your Platform's Pubkey (where you receive the 10%)
const PLATFORM_PUBKEY = "4a1d950a6dbed94974f260388e63ec9d93e878701e6ef855140e6c55ccbdae3d"
const PLATFORM_SPLIT = 10 // 10%

type MapEventStore struct {
	mu     sync.Mutex
	events map[string]*nostr.Event
}

func (m *MapEventStore) SaveEvent(ctx context.Context, event *nostr.Event) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events[event.ID] = event
	return nil
}

func (m *MapEventStore) DeleteEvent(ctx context.Context, event *nostr.Event) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.events, event.ID)
	return nil
}

func (m *MapEventStore) QueryEvents(ctx context.Context, filter nostr.Filter) (chan *nostr.Event, error) {
	ch := make(chan *nostr.Event)
	go func() {
		m.mu.Lock()
		defer m.mu.Unlock()
		defer close(ch)
		for _, event := range m.events {
			if filter.Matches(event) {
				ch <- event
			}
		}
	}()
	return ch, nil
}

func main() {
	relay := khatru.NewRelay()

	relay.Info.Name = "AudioZap Music Relay"
	relay.Info.Description = "A relay for music that enforces revenue splits."

	// 1. Store events in memory
	db := &MapEventStore{
		events: make(map[string]*nostr.Event),
	}
	relay.StoreEvent = append(relay.StoreEvent, db.SaveEvent)
	relay.QueryEvents = append(relay.QueryEvents, db.QueryEvents)
	relay.DeleteEvent = append(relay.DeleteEvent, db.DeleteEvent)

	// 2. POLICY: Enforce "Platform Tax" on Music Events (Kind 31337)
	relay.RejectEvent = append(relay.RejectEvent,
		policies.ValidateKind,
		func(ctx context.Context, event *nostr.Event) (bool, string) {
			log.Printf("Received event kind %d from %s", event.Kind, event.PubKey)
			// Only apply logic to Music Events (Kind 31337 is "Audio Track")
			if event.Kind == 31337 {
				hasSplit := false
				for _, tag := range event.Tags {
					// Tag format: ["zap", "pubkey", "relay", "weight"]
					if tag[0] == "zap" && len(tag) >= 4 {
						if tag[1] == PLATFORM_PUBKEY {
							weight, _ := strconv.Atoi(tag[3])
							if weight >= PLATFORM_SPLIT {
								hasSplit = true
							}
						}
					}
				}
				if !hasSplit {
					msg := "REJECTED: You must include a 10% zap split to the platform."
					log.Printf("Event %s REJECTED: %s", event.ID, msg)
					return true, msg
				}
			}
			log.Printf("Event %s ACCEPTED", event.ID)
			return false, "" // Accept event
		},
	)

	relay.OnConnect = append(relay.OnConnect, func(ctx context.Context) {
		log.Printf("New connection from %s", khatru.GetIP(ctx))
	})

	log.Println("Relay running on :3334")
	http.ListenAndServe(":3334", relay)
}