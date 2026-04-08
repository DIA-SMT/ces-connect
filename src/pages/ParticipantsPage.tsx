import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Shield, Building2, UserCircle } from 'lucide-react';

const ParticipantsPage = () => {
  const { user } = useAuth();
  const { participants, addParticipant } = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddParticipant = async () => {
    if (!name || !role || !organization) return;
    await addParticipant({ name, role, organization });
    setName('');
    setRole('');
    setOrganization('');
    setOpen(false);
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 px-2 sm:px-0">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Directorio de Participantes</h1>
          <p className="text-slate-600 dark:text-white/70 mt-1">Gestione la lista global de personas habilitadas</p>
        </div>

        {user?.role === 'admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 font-medium">
                <Plus className="w-4 h-4" />
                Agregar participante
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Agregar nuevo participante</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Nombre completo</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" className="rounded-xl bg-white/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Rol o Cargo</Label>
                  <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ej: Delegado" className="rounded-xl bg-white/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Organización</Label>
                  <Input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Ej: Facultad de Ciencias..." className="rounded-xl bg-white/50" />
                </div>
                <Button onClick={handleAddParticipant} disabled={!name || !role || !organization} className="w-full rounded-xl">Registrar participante</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-card rounded-2xl p-2 w-full max-w-sm mb-6 flex items-center">
        <Users className="w-5 h-5 text-slate-400 mx-3" />
        <input
          type="text"
          placeholder="Buscar participantes..."
          className="bg-transparent border-none outline-none text-sm w-full h-8 text-slate-700 placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredParticipants.length === 0 ? (
          <div className="col-span-full glass-card rounded-2xl p-12 text-center">
            <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron participantes.</p>
          </div>
        ) : (
          filteredParticipants.map(participant => (
            <div key={participant.id} className="glass-card rounded-[1.5rem] p-5 hover:shadow-lg transition-all border border-white/40">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-lg">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{participant.name}</h3>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/70">
                      <Shield className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                      <span className="truncate">{participant.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/70">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{participant.organization}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ParticipantsPage;
