import type { Meta, StoryObj } from '@storybook/angular';
import { BottomSheetDialogComponent } from './bottom-sheet-dialog';

const meta: Meta<BottomSheetDialogComponent> = { component: BottomSheetDialogComponent, tags: ['autodocs'] };
export default meta;

export const Primary: StoryObj<BottomSheetDialogComponent> = {
  render: () => ({
    template: `
      <ibid-bottom-sheet-dialog>
        <span sheet-title>Encerrar projeto: cozinha nova</span>
        <p>Este projeto terminou a 28 jul. Sobram 340€ depois de todas as despesas associadas.</p>
        <div sheet-footer>
          <button class="a-button a-button--secondary" type="button">cancelar</button>
          <button class="a-button a-button--primary" type="button">confirmar encerramento</button>
        </div>
      </ibid-bottom-sheet-dialog>
    `
  })
};
