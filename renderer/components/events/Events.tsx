import { useEffect, useState } from "react";
import { useContractEvents } from "hooks/useContractEvents";

import { createContractEventsColumns } from "components/events/events-columns";
import { EventsDataTable } from "components/events/events-data-table";
import ContractEventModal from "components/events/event-modal";
import NoEvents from "components/events/no-events";
import Loading from "components/common/loading";

import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { Button } from "components/ui/button";
import { LucidePersonStanding } from "lucide-react";

export default function EventsComponent() {
  const [allContractEvents, setAllContractEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const contractEvents = useContractEvents();

  useEffect(() => {
    if (contractEvents) {
      setAllContractEvents(contractEvents);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [contractEvents]);

  // Handler functions for the columns
  const handleEditEvent = (event: any) => {
    console.log("Edit event:", event);
  };

  const handleDeleteEvent = (event: any) => {
    console.log("Delete event:", event);
  };

  const handleTriggerEvent = (event: any) => {
    console.log("Trigger event:", event);
  };

  const columns = createContractEventsColumns(
    handleEditEvent,
    handleDeleteEvent,
    handleTriggerEvent
  );

  return (
    <div className="flex flex-col h-[calc(100vh-106px)]">
      {isLoading ? (
        <Loading />
      ) : allContractEvents.length >= 0 ? (
        <EventsDataTable 
          columns={columns} 
          data={allContractEvents}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onTrigger={handleTriggerEvent}
        />
      ) : (
        <NoEvents />
      )}
    </div>
  );
}
