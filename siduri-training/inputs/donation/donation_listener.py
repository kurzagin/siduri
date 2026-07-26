# TODO (later phase): listen for donation/sub/bit events from your streaming
# platform's API or a service like StreamElements/Streamlabs.
#
# from core.events import Event
# event = Event(type="donation", payload={"user": name, "amount": amt, "message": msg})
# on_event(event)
#
# Donation is already the highest-priority event type in core/events.py,
# so once this fires, the reactor will treat it as must-respond automatically.
