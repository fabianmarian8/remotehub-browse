import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            RemoteJobsHub
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Find your dream remote job
          </p>
        </div>
        <Button 
          size="lg"
          className="text-lg px-8 py-6 transition-all hover:scale-105"
        >
          Browse Jobs
        </Button>
      </div>
    </div>
  );
};

export default Index;
