import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

vi.mock('../context/UserContext', () => ({
  useUser: () => ({ user: { id: 1, firstName: 'Анна' } }),
}));

vi.mock('../utils/api', () => ({
  groupsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@telegram-apps/telegram-ui', () => ({
  Button: ({ children, onClick, mode }: any) => (
    <button data-mode={mode} onClick={onClick}>{children}</button>
  ),
  List: ({ children }: any) => <div>{children}</div>,
  Section: ({ children, header }: any) => <div><div>{header}</div>{children}</div>,
  Cell: ({ children, before, subtitle, after }: any) => (
    <div>{before}<span>{children}</span><span>{subtitle}</span>{after}</div>
  ),
  Avatar: ({ children }: any) => <span>{children}</span>,
  Title: ({ children, level }: any) => <h2 data-level={level}>{children}</h2>,
  Input: ({ header, placeholder, value, onChange, style }: any) => (
    <div style={style}>
      <label>{header}</label>
      <input placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  ),
}));

const renderHomePage = () =>
  render(<BrowserRouter><HomePage /></BrowserRouter>);

describe('HomePage', () => {
  it('показывает индикатор загрузки при старте', async () => {
    renderHomePage();
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument());
  });

  it('отображает заголовок "Мои группы" после загрузки', async () => {
    renderHomePage();
    await waitFor(() => expect(screen.getByText('Мои группы')).toBeInTheDocument());
  });

  it('показывает сообщение об отсутствии групп', async () => {
    renderHomePage();
    await waitFor(() =>
      expect(screen.getByText('Нет групп. Создайте первую!')).toBeInTheDocument()
    );
  });

  it('показывает кнопку "+ Создать"', async () => {
    renderHomePage();
    await waitFor(() => expect(screen.getByText('+ Создать')).toBeInTheDocument());
  });

  it('открывает форму создания группы по кнопке', async () => {
    renderHomePage();
    await waitFor(() => screen.getByText('+ Создать'));
    await userEvent.click(screen.getByText('+ Создать'));
    expect(screen.getByPlaceholderText('Например: Рыбалка')).toBeInTheDocument();
  });

  it('отображает список групп, полученных от API', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValueOnce([
      { id: 1, name: 'Рыбалка', icon: '🎣', membersCount: 3 },
    ] as any);
    renderHomePage();
    await waitFor(() => expect(screen.getByText('Рыбалка')).toBeInTheDocument());
    expect(screen.getByText('3 участников')).toBeInTheDocument();
  });
});
