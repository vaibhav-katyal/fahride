import { MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface Ride {
  id: string;
  driverName: string;
  carModel: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  pricePerMile: string;
  seats: number;
  eta: string;
  avatar: string;
}

const RideCard = ({ ride, onRequest }: { ride: Ride; onRequest?: () => void }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/ride/${ride.id}`)}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">
            {ride.avatar}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{ride.driverName}</p>
            <p className="text-[11px] text-muted-foreground">{ride.carModel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequest?.();
            }}
            className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Request
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Contact ${ride.driverName} from ride details after approval.`);
            }}
            className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center mt-1">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <div className="w-px h-6 bg-border" />
          <div className="w-2 h-2 rounded-full border-2 border-foreground" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{ride.from}</p>
            <span className="text-[11px] text-muted-foreground">{ride.departureTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{ride.to}</p>
            <span className="text-[11px] text-muted-foreground">{ride.arrivalTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <span className="font-bold text-foreground">{ride.pricePerMile}</span>
          <span className="text-[11px] text-muted-foreground ml-1">per mile</span>
        </div>
        <div>
          <span className="font-bold text-foreground">{ride.seats}</span>
          <span className="text-[11px] text-muted-foreground ml-1">Seats</span>
        </div>
        <div>
          <span className="font-bold text-foreground">{ride.eta}</span>
          <span className="text-[11px] text-muted-foreground ml-1">Arrival</span>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
