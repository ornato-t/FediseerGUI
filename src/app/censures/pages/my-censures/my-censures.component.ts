import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-my-censures',
  templateUrl: './my-censures.component.html',
  styleUrls: ['./my-censures.component.scss']
})
export class MyCensuresComponent implements OnInit {
  public instances: NormalizedInstanceDetailResponse[] = [];
  public instance: Observable<Instance> = this.authManager.currentInstance;
  public guaranteed: boolean = false;
  public loading: boolean = true;
  public software: string | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly cachedApi: CachedFediseerApiService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = `My censures`;

    const responses = await Promise.all([
      toPromise(this.api.getCensuresByInstances([this.authManager.currentInstanceSnapshot.name])),
      toPromise(this.cachedApi.getCurrentInstanceInfo()),
    ])

    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.instances = responses[0].successResponse!.instances
      .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
    this.guaranteed = responses[1].successResponse!.guarantor !== undefined;
    this.software = responses[1].successResponse!.software.toLowerCase();

    this.loading = false;
  }

  public async cancelCensure(instance: string): Promise<void> {
    this.loading = true;
    this.api.cancelCensure(instance).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        this.loading = false;
        return;
      }

      this.instances = this.instances.filter(
        censuredInstance => censuredInstance.domain !== instance,
      );
      this.loading = false;
    });
  }
}
