import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskHistory extends Document {
  usuario: mongoose.Types.ObjectId;
  tarefa: mongoose.Types.ObjectId;
  dataConclusao: Date;
  xpGanho: number;
}

const taskHistorySchema = new Schema<ITaskHistory>({
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tarefa: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  dataConclusao: { type: Date, default: Date.now },
  xpGanho: { type: Number, required: true },
});

export default mongoose.model<ITaskHistory>('TaskHistory', taskHistorySchema);