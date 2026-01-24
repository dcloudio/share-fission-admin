export const columns = [
  { key: 'avatar', dataKey: 'avatar', title: '头像', width: 80, align: 'center' },
  { key: 'username', dataKey: 'username', title: '用户名', width: 140 },
  { key: 'nickname', dataKey: 'nickname', title: '昵称', width: 120 },
  { key: 'mobile', dataKey: 'mobile', title: '手机号', width: 140 },
  { key: 'email', dataKey: 'email', title: '邮箱', width: 140 },
  { key: 'score_balance', dataKey: 'score_balance', title: '积分余额', width: 110, align: 'right', sortable: true },
  { key: 'score_total', dataKey: 'score_total', title: '累计积分', width: 110, align: 'right', sortable: true },
  { key: 'score_withdrawn', dataKey: 'score_withdrawn', title: '已提现积分', width: 120, align: 'right', sortable: true },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'register_date', dataKey: 'register_date', title: '注册时间', width: 160, sortable: true },
  { key: 'last_login_date', dataKey: 'last_login_date', title: '最后登录', width: 160, sortable: true }
]
